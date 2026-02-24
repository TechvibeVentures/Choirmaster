-- Reconcile migration history metadata on hosted Supabase.
-- This script is additive and idempotent. It does not execute migrations.

begin;

insert into supabase_migrations.schema_migrations
  (version, name, statements, created_by, idempotency_key, rollback)
values
  ('001', '001_identity_link', null, null, null, null),
  ('002', '002_person_settings', null, null, null, null),
  ('003', '003_repertoire', null, null, null, null),
  ('004', '004_rls_repertoire_settings', null, null, null, null),
  ('005', '005_workflow_functions', null, null, null, null),
  ('006', '006_indexes_perf', null, null, null, null),
  ('007', '007_fix_projects_participants_rls_recursion', null, null, null, null),
  ('008', '008_admin_roles_include_manager', null, null, null, null),
  ('009', '009_auth_users_cascade_delete', null, null, null, null),
  ('010', '010_move_voice_to_persons', null, null, null, null),
  ('011', '011_project_invites', null, null, null, null),
  ('012', '012_fix_accept_project_invite_record_fields', null, null, null, null),
  ('013', '013_fix_accept_project_invite_singer_status_cast', null, null, null, null),
  ('014', '014_fix_accept_project_invite_variable_conflict', null, null, null, null),
  ('015', '015_project_invites_rls_policies', null, null, null, null),
  ('016', '016_fk_indexes_health', null, null, null, null)
on conflict (version) do nothing;

commit;
