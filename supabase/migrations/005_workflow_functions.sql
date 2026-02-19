-- 005_workflow_functions.sql
-- Workflow helpers used by Next.js service-role endpoints.

create or replace function public.bootstrap_admin_choir(
  p_auth_user_id uuid,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_city text,
  p_role text,
  p_language text default 'Deutsch',
  p_timezone text default 'Europe/Zurich',
  p_choir_name text default 'Neuer Chor',
  p_choir_city text default '',
  p_choir_type text default 'mixed',
  p_choir_genres text[] default '{}'::text[],
  p_rehearsal_weekdays text[] default array['Tue']::text[],
  p_rehearsal_start_time text default '19:30',
  p_rehearsal_end_time text default '21:30',
  p_default_location text default null,
  p_create_default_project boolean default true
)
returns table (
  person_id uuid,
  choir_id uuid,
  project_id uuid,
  active_choir_id uuid,
  project_access_token text
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_person_id uuid;
  v_choir_id uuid;
  v_project_id uuid;
  v_project_token text;
  v_db_role text;
  v_roles text[];
  v_email text;
begin
  v_email := lower(trim(coalesce(p_email, '')));

  if v_email = '' then
    raise exception 'Email is required';
  end if;

  v_db_role := case p_role
    when 'chair' then 'chairman'
    when 'conductor' then 'conductor'
    when 'manager' then 'manager'
    else 'manager'
  end;

  if v_db_role = 'manager' then
    v_roles := array['manager']::text[];
  else
    v_roles := array[v_db_role, 'manager']::text[];
  end if;

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
      auth_user_id
    )
    values (
      v_email,
      coalesce(p_first_name, ''),
      coalesce(p_last_name, ''),
      coalesce(p_city, ''),
      'professional',
      array['Leitung']::text[],
      p_auth_user_id
    )
    returning id into v_person_id;
  else
    update public.persons
    set
      first_name = coalesce(nullif(p_first_name, ''), first_name),
      last_name = coalesce(nullif(p_last_name, ''), last_name),
      city = coalesce(p_city, city),
      auth_user_id = coalesce(p_auth_user_id, auth_user_id)
    where id = v_person_id;
  end if;

  insert into public.choirs (
    name,
    city,
    type,
    genres,
    rehearsal_weekdays,
    rehearsal_start_time,
    rehearsal_end_time,
    default_location
  )
  values (
    coalesce(nullif(p_choir_name, ''), 'Neuer Chor'),
    coalesce(p_choir_city, ''),
    coalesce(nullif(p_choir_type, ''), 'mixed'),
    coalesce(p_choir_genres, '{}'::text[]),
    coalesce(p_rehearsal_weekdays, array['Tue']::text[]),
    coalesce(nullif(p_rehearsal_start_time, ''), '19:30'),
    coalesce(nullif(p_rehearsal_end_time, ''), '21:30'),
    nullif(p_default_location, '')
  )
  returning id into v_choir_id;

  insert into public.choir_memberships (
    choir_id,
    person_id,
    roles,
    singer_status,
    voice
  )
  values (
    v_choir_id,
    v_person_id,
    v_roles,
    'active',
    'Soprano'
  )
  on conflict (choir_id, person_id)
  do update set
    roles = excluded.roles,
    singer_status = excluded.singer_status,
    voice = excluded.voice;

  insert into public.person_settings (
    person_id,
    language,
    timezone,
    active_choir_id
  )
  values (
    v_person_id,
    coalesce(nullif(p_language, ''), 'Deutsch'),
    coalesce(nullif(p_timezone, ''), 'Europe/Zurich'),
    v_choir_id
  )
  on conflict (person_id)
  do update set
    language = excluded.language,
    timezone = excluded.timezone,
    active_choir_id = excluded.active_choir_id;

  if p_create_default_project then
    insert into public.projects (
      choir_id,
      name,
      description,
      date_range_start,
      date_range_end,
      concerts
    )
    values (
      v_choir_id,
      'Neues Projekt',
      'Projekt wurde beim Onboarding erstellt.',
      current_date,
      (current_date + interval '90 days')::date,
      '[]'::jsonb
    )
    returning id into v_project_id;

    insert into public.project_access_tokens (
      project_id,
      active
    )
    values (
      v_project_id,
      true
    )
    returning token into v_project_token;
  end if;

  return query
  select
    v_person_id,
    v_choir_id,
    v_project_id,
    v_choir_id,
    v_project_token;
end;
$function$;

create or replace function public.commit_project_invites(
  p_project_id uuid,
  p_invites jsonb
)
returns table (
  created_persons integer,
  upserted_memberships integer,
  upserted_participants integer
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_choir_id uuid;
  v_invite jsonb;
  v_person_id uuid;
  v_email text;
  v_first_name text;
  v_last_name text;
  v_name text;
  v_voice text;
  v_roles text[];
  v_role_item text;
  v_created_persons integer := 0;
  v_upserted_memberships integer := 0;
  v_upserted_participants integer := 0;
begin
  select p.choir_id into v_choir_id
  from public.projects p
  where p.id = p_project_id;

  if v_choir_id is null then
    raise exception 'Project not found';
  end if;

  for v_invite in
    select value
    from jsonb_array_elements(coalesce(p_invites, '[]'::jsonb))
  loop
    v_email := lower(trim(coalesce(v_invite ->> 'email', '')));

    if v_email = '' then
      continue;
    end if;

    v_first_name := coalesce(v_invite ->> 'first_name', '');
    v_last_name := coalesce(v_invite ->> 'last_name', '');
    v_name := coalesce(v_invite ->> 'name', '');

    if v_first_name = '' and v_name <> '' then
      v_first_name := split_part(v_name, ' ', 1);
    end if;

    if v_last_name = '' and v_name <> '' then
      v_last_name := ltrim(substring(v_name from length(split_part(v_name, ' ', 1)) + 1));
    end if;

    v_voice := nullif(trim(coalesce(v_invite ->> 'voice', '')), '');
    v_roles := array['singer']::text[];

    for v_role_item in
      select value
      from jsonb_array_elements_text(coalesce(v_invite -> 'roles', '[]'::jsonb))
    loop
      if not (v_roles @> array[v_role_item]) then
        v_roles := v_roles || v_role_item;
      end if;
    end loop;

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
        tags
      )
      values (
        v_email,
        coalesce(v_first_name, ''),
        coalesce(v_last_name, ''),
        '',
        'regular',
        '{}'::text[]
      )
      returning id into v_person_id;

      v_created_persons := v_created_persons + 1;
    end if;

    insert into public.choir_memberships (
      choir_id,
      person_id,
      roles,
      singer_status,
      voice
    )
    values (
      v_choir_id,
      v_person_id,
      v_roles,
      'project_only',
      v_voice
    )
    on conflict (choir_id, person_id)
    do update set
      roles = excluded.roles,
      singer_status = excluded.singer_status,
      voice = coalesce(excluded.voice, choir_memberships.voice);

    v_upserted_memberships := v_upserted_memberships + 1;

    insert into public.project_participants (
      project_id,
      person_id,
      invite_status
    )
    values (
      p_project_id,
      v_person_id,
      'invited'
    )
    on conflict (project_id, person_id)
    do update set invite_status = excluded.invite_status;

    v_upserted_participants := v_upserted_participants + 1;
  end loop;

  return query
  select
    v_created_persons,
    v_upserted_memberships,
    v_upserted_participants;
end;
$function$;

create or replace function public.join_project_with_token(
  p_token text,
  p_auth_user_id uuid,
  p_email text,
  p_first_name text default '',
  p_last_name text default '',
  p_city text default '',
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
declare
  v_project_id uuid;
  v_choir_id uuid;
  v_person_id uuid;
  v_email text;
begin
  v_email := lower(trim(coalesce(p_email, '')));

  if v_email = '' then
    raise exception 'Email is required';
  end if;

  select pat.project_id into v_project_id
  from public.project_access_tokens pat
  where pat.token = p_token
    and pat.active = true
  limit 1;

  if v_project_id is null then
    raise exception 'Invalid token';
  end if;

  select p.choir_id into v_choir_id
  from public.projects p
  where p.id = v_project_id;

  if v_choir_id is null then
    raise exception 'Project not found';
  end if;

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
      auth_user_id
    )
    values (
      v_email,
      coalesce(p_first_name, ''),
      coalesce(p_last_name, ''),
      coalesce(p_city, ''),
      'regular',
      '{}'::text[],
      p_auth_user_id
    )
    returning id into v_person_id;
  else
    update public.persons
    set
      first_name = coalesce(nullif(p_first_name, ''), first_name),
      last_name = coalesce(nullif(p_last_name, ''), last_name),
      city = coalesce(nullif(p_city, ''), city),
      auth_user_id = coalesce(p_auth_user_id, auth_user_id)
    where id = v_person_id;
  end if;

  insert into public.choir_memberships (
    choir_id,
    person_id,
    roles,
    singer_status,
    voice
  )
  values (
    v_choir_id,
    v_person_id,
    array['singer']::text[],
    'project_only',
    nullif(p_voice, '')
  )
  on conflict (choir_id, person_id)
  do update set
    singer_status = 'project_only',
    voice = coalesce(excluded.voice, choir_memberships.voice);

  insert into public.project_participants (
    project_id,
    person_id,
    invite_status
  )
  values (
    v_project_id,
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
    v_choir_id
  )
  on conflict (person_id)
  do update set active_choir_id = excluded.active_choir_id;

  return query
  select
    v_person_id,
    v_choir_id,
    v_project_id,
    'confirmed'::public.invite_status;
end;
$function$;
