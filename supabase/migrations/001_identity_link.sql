-- 001_identity_link.sql
-- Link public.persons to auth.users through auth_user_id and prioritize auth.uid() identity.

alter table public.persons
  add column if not exists auth_user_id uuid;

create unique index if not exists persons_auth_user_id_key
  on public.persons (auth_user_id)
  where auth_user_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'persons_auth_user_id_fkey'
      and conrelid = 'public.persons'::regclass
  ) then
    alter table public.persons
      add constraint persons_auth_user_id_fkey
      foreign key (auth_user_id)
      references auth.users(id)
      on delete set null;
  end if;
end
$$;

update public.persons as p
set auth_user_id = u.id
from auth.users as u
where p.auth_user_id is null
  and u.email is not null
  and lower(u.email) = lower(p.email);

create or replace function public.current_person_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $function$
  select p.id
  from public.persons as p
  where (
    auth.uid() is not null
    and p.auth_user_id = auth.uid()
  )
  or (
    (
      auth.uid() is null
      or p.auth_user_id is null
    )
    and lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  order by
    case
      when auth.uid() is not null and p.auth_user_id = auth.uid() then 0
      else 1
    end,
    p.created_at asc
  limit 1;
$function$;
