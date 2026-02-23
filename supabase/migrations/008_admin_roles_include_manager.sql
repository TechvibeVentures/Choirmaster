-- 008_admin_roles_include_manager.sql
-- Treat manager as admin across helper functions and policies.

create or replace function public.is_admin(choir uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $function$
  select exists (
    select 1
    from public.choir_memberships cm
    where cm.choir_id = choir
      and cm.person_id = public.current_person_id()
      and (
        cm.roles @> array['chairman']::text[]
        or cm.roles @> array['conductor']::text[]
        or cm.roles @> array['manager']::text[]
      )
  );
$function$;

create or replace function public.is_member(choir uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $function$
  select exists (
    select 1
    from public.choir_memberships cm
    where cm.choir_id = choir
      and cm.person_id = public.current_person_id()
  );
$function$;

drop policy if exists persons_admin_write on public.persons;
create policy persons_admin_write
on public.persons
for insert
with check (
  exists (
    select 1
    from public.choir_memberships m
    where m.person_id = public.current_person_id()
      and public.is_admin(m.choir_id)
  )
);

drop policy if exists persons_select_self_or_admin on public.persons;
create policy persons_select_self_or_admin
on public.persons
for select
using (
  id = public.current_person_id()
  or exists (
    select 1
    from public.choir_memberships admin_m
    join public.choir_memberships target_m
      on target_m.person_id = persons.id
      and target_m.choir_id = admin_m.choir_id
    where admin_m.person_id = public.current_person_id()
      and public.is_admin(admin_m.choir_id)
  )
);

drop policy if exists persons_update_self_or_admin on public.persons;
create policy persons_update_self_or_admin
on public.persons
for update
using (
  id = public.current_person_id()
  or exists (
    select 1
    from public.choir_memberships admin_m
    join public.choir_memberships target_m
      on target_m.person_id = persons.id
      and target_m.choir_id = admin_m.choir_id
    where admin_m.person_id = public.current_person_id()
      and public.is_admin(admin_m.choir_id)
  )
)
with check (
  id = public.current_person_id()
  or exists (
    select 1
    from public.choir_memberships admin_m
    join public.choir_memberships target_m
      on target_m.person_id = persons.id
      and target_m.choir_id = admin_m.choir_id
    where admin_m.person_id = public.current_person_id()
      and public.is_admin(admin_m.choir_id)
  )
);

drop policy if exists person_settings_select_self_or_admin on public.person_settings;
create policy person_settings_select_self_or_admin
on public.person_settings
for select
using (
  person_id = public.current_person_id()
  or exists (
    select 1
    from public.choir_memberships admin_m
    join public.choir_memberships target_m
      on target_m.choir_id = admin_m.choir_id
    where admin_m.person_id = public.current_person_id()
      and target_m.person_id = person_settings.person_id
      and public.is_admin(admin_m.choir_id)
  )
);

drop policy if exists person_settings_write_self_or_admin on public.person_settings;
create policy person_settings_write_self_or_admin
on public.person_settings
for all
using (
  person_id = public.current_person_id()
  or exists (
    select 1
    from public.choir_memberships admin_m
    join public.choir_memberships target_m
      on target_m.choir_id = admin_m.choir_id
    where admin_m.person_id = public.current_person_id()
      and target_m.person_id = person_settings.person_id
      and public.is_admin(admin_m.choir_id)
  )
)
with check (
  person_id = public.current_person_id()
  or exists (
    select 1
    from public.choir_memberships admin_m
    join public.choir_memberships target_m
      on target_m.choir_id = admin_m.choir_id
    where admin_m.person_id = public.current_person_id()
      and target_m.person_id = person_settings.person_id
      and public.is_admin(admin_m.choir_id)
  )
);
