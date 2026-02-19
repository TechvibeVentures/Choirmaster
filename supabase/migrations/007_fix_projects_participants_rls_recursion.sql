-- 007_fix_projects_participants_rls_recursion.sql
-- Break RLS recursion between projects <-> project_participants.

create or replace function public.is_project_participant(p_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $function$
  select exists (
    select 1
    from public.project_participants pp
    where pp.project_id = p_project_id
      and pp.person_id = public.current_person_id()
  );
$function$;

create or replace function public.is_admin_of_project(p_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $function$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and public.is_admin(p.choir_id)
  );
$function$;

drop policy if exists projects_select_admin_or_participant on public.projects;
create policy projects_select_admin_or_participant
on public.projects
for select
to public
using (
  public.is_admin(choir_id)
  or public.is_project_participant(id)
);

drop policy if exists participants_select_admin_or_self on public.project_participants;
create policy participants_select_admin_or_self
on public.project_participants
for select
to public
using (
  person_id = public.current_person_id()
  or public.is_admin_of_project(project_id)
);

drop policy if exists participants_admin_delete on public.project_participants;
create policy participants_admin_delete
on public.project_participants
for delete
to public
using (public.is_admin_of_project(project_id));

drop policy if exists participants_admin_update on public.project_participants;
create policy participants_admin_update
on public.project_participants
for update
to public
using (public.is_admin_of_project(project_id))
with check (public.is_admin_of_project(project_id));

drop policy if exists participants_admin_write on public.project_participants;
create policy participants_admin_write
on public.project_participants
for insert
to public
with check (public.is_admin_of_project(project_id));

drop policy if exists rehearsals_select_admin_or_participant on public.rehearsals;
create policy rehearsals_select_admin_or_participant
on public.rehearsals
for select
to public
using (
  public.is_admin_of_project(project_id)
  or public.is_project_participant(project_id)
);

drop policy if exists rehearsals_admin_delete on public.rehearsals;
create policy rehearsals_admin_delete
on public.rehearsals
for delete
to public
using (public.is_admin_of_project(project_id));

drop policy if exists rehearsals_admin_update on public.rehearsals;
create policy rehearsals_admin_update
on public.rehearsals
for update
to public
using (public.is_admin_of_project(project_id))
with check (public.is_admin_of_project(project_id));

drop policy if exists rehearsals_admin_write on public.rehearsals;
create policy rehearsals_admin_write
on public.rehearsals
for insert
to public
with check (public.is_admin_of_project(project_id));
