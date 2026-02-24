-- 015_project_invites_rls_policies.sql
-- Add admin-only RLS policies for project_invites.

drop policy if exists project_invites_admin_select on public.project_invites;
create policy project_invites_admin_select
  on public.project_invites
  for select
  using (public.is_admin(choir_id));

drop policy if exists project_invites_admin_insert on public.project_invites;
create policy project_invites_admin_insert
  on public.project_invites
  for insert
  with check (public.is_admin(choir_id));

drop policy if exists project_invites_admin_update on public.project_invites;
create policy project_invites_admin_update
  on public.project_invites
  for update
  using (public.is_admin(choir_id))
  with check (public.is_admin(choir_id));

drop policy if exists project_invites_admin_delete on public.project_invites;
create policy project_invites_admin_delete
  on public.project_invites
  for delete
  using (public.is_admin(choir_id));
