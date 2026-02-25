-- 018_enforce_voice_capacity.sql
-- Enforce per-voice choir capacity whenever a real singer membership is created/updated.

create or replace function public.assert_choir_voice_capacity(
  p_choir_id uuid,
  p_voice text,
  p_exclude_person_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_voice text;
  v_distribution jsonb;
  v_limit integer;
  v_current integer;
begin
  if p_choir_id is null then
    raise exception 'choir_id_required' using errcode = 'P0001';
  end if;

  v_voice := case
    when lower(trim(coalesce(p_voice, ''))) in ('soprano', 'sopran') then 'Soprano'
    when lower(trim(coalesce(p_voice, ''))) in ('alto', 'alt') then 'Alto'
    when lower(trim(coalesce(p_voice, ''))) = 'tenor' then 'Tenor'
    when lower(trim(coalesce(p_voice, ''))) in ('bass', 'basso') then 'Bass'
    else null
  end;

  if v_voice is null then
    raise exception 'voice_missing_for_capacity' using errcode = 'P0001';
  end if;

  select c.voice_distribution
  into v_distribution
  from public.choirs c
  where c.id = p_choir_id
  limit 1;

  if v_distribution is null then
    v_distribution := '{"Soprano":[4,4,0],"Alto":[4,4,0],"Tenor":[4,4,0],"Bass":[4,4,0]}'::jsonb;
  end if;

  v_limit :=
    coalesce(((v_distribution -> v_voice) ->> 0)::integer, 0) +
    coalesce(((v_distribution -> v_voice) ->> 1)::integer, 0) +
    coalesce(((v_distribution -> v_voice) ->> 2)::integer, 0);

  select count(*)
  into v_current
  from public.choir_memberships cm
  join public.persons p on p.id = cm.person_id
  where cm.choir_id = p_choir_id
    and (p_exclude_person_id is null or cm.person_id <> p_exclude_person_id)
    and cm.roles @> array['singer']::text[]
    and coalesce(cm.singer_status, 'active'::public.singer_status) <> 'inactive'::public.singer_status
    and p.voice = v_voice;

  if v_current >= v_limit then
    raise exception 'voice_capacity_exceeded|%|%|%', v_voice, v_current, v_limit
      using errcode = 'P0001';
  end if;
end;
$function$;

create or replace function public.accept_project_invite(
  p_token text,
  p_first_name text default '',
  p_last_name text default '',
  p_voice text default null
)
returns table (
  person_id uuid,
  choir_id uuid,
  project_id uuid,
  invite_status public.invite_status
)
language plpgsql
security definer
set search_path = public
as $function$
#variable_conflict use_column
declare
  v_invite record;
  v_person_id uuid;
  v_email text;
  v_first_name text;
  v_last_name text;
  v_voice text;
  v_token_hash text;
  v_roles text[];
  v_singer_status public.singer_status;
begin
  v_token_hash := encode(sha256(convert_to(coalesce(trim(p_token), ''), 'UTF8')), 'hex');

  select
    pi.id,
    pi.project_id,
    pi.choir_id,
    pi.email,
    pi.first_name,
    pi.last_name,
    pi.voice,
    pi.roles,
    pi.singer_status
  into v_invite
  from public.project_invites pi
  where pi.token_hash = v_token_hash
    and pi.status in ('pending', 'sent')
    and pi.expires_at > now()
  limit 1;

  if v_invite.id is null then
    raise exception 'Invalid or expired invite token';
  end if;

  v_email := lower(trim(v_invite.email));
  v_first_name := coalesce(nullif(trim(p_first_name), ''), v_invite.first_name, '');
  v_last_name := coalesce(nullif(trim(p_last_name), ''), v_invite.last_name, '');
  v_voice := case
    when lower(trim(coalesce(p_voice, ''))) in ('soprano', 'sopran') then 'Soprano'
    when lower(trim(coalesce(p_voice, ''))) in ('alto', 'alt') then 'Alto'
    when lower(trim(coalesce(p_voice, ''))) = 'tenor' then 'Tenor'
    when lower(trim(coalesce(p_voice, ''))) in ('bass', 'basso') then 'Bass'
    when v_invite.voice is not null then v_invite.voice
    else null
  end;

  v_roles := coalesce(v_invite.roles, array['singer']::text[]);
  v_singer_status := case
    when v_invite.singer_status in ('active', 'inactive', 'project_only')
      then v_invite.singer_status::public.singer_status
    else 'project_only'::public.singer_status
  end;

  select p.id into v_person_id
  from public.persons p
  where lower(p.email) = v_email
  limit 1;

  if v_person_id is null then
    insert into public.persons (
      email,
      first_name,
      last_name,
      city,
      experience_level,
      tags,
      voice
    )
    values (
      v_email,
      v_first_name,
      v_last_name,
      '',
      'regular',
      '{}'::text[],
      v_voice
    )
    returning id into v_person_id;
  else
    update public.persons
    set
      first_name = coalesce(nullif(v_first_name, ''), first_name),
      last_name = coalesce(nullif(v_last_name, ''), last_name),
      voice = coalesce(v_voice, voice)
    where id = v_person_id;
  end if;

  if v_roles @> array['singer']::text[] and v_singer_status <> 'inactive'::public.singer_status then
    perform public.assert_choir_voice_capacity(v_invite.choir_id, v_voice, v_person_id);
  end if;

  insert into public.choir_memberships (
    choir_id,
    person_id,
    roles,
    singer_status
  )
  values (
    v_invite.choir_id,
    v_person_id,
    v_roles,
    v_singer_status
  )
  on conflict (choir_id, person_id)
  do update set
    roles = excluded.roles,
    singer_status = excluded.singer_status;

  insert into public.project_participants (
    project_id,
    person_id,
    invite_status
  )
  values (
    v_invite.project_id,
    v_person_id,
    'confirmed'
  )
  on conflict (project_id, person_id)
  do update set invite_status = 'confirmed';

  insert into public.person_settings (
    person_id,
    active_choir_id
  )
  values (
    v_person_id,
    v_invite.choir_id
  )
  on conflict (person_id)
  do update set active_choir_id = excluded.active_choir_id;

  update public.project_invites
  set
    status = 'accepted',
    accepted_at = now()
  where id = v_invite.id;

  return query
  select
    v_person_id,
    v_invite.choir_id,
    v_invite.project_id,
    'confirmed'::public.invite_status;
end;
$function$;
