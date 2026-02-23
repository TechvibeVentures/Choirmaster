-- 009_auth_users_cascade_delete.sql
-- When a user is deleted from auth.users (e.g. via Supabase Dashboard), cascade delete
-- the linked person and all related data instead of leaving orphaned rows.
--
-- See: https://supabase.com/docs/guides/auth/managing-user-data

-- 1. persons.auth_user_id: change ON DELETE SET NULL → ON DELETE CASCADE
--    When auth.users row is deleted, the corresponding person(s) are deleted.
alter table public.persons
  drop constraint if exists persons_auth_user_id_fkey;

alter table public.persons
  add constraint persons_auth_user_id_fkey
  foreign key (auth_user_id)
  references auth.users(id)
  on delete cascade;

-- 2. availability.updated_by_person_id: change to ON DELETE SET NULL
--    Otherwise deleting a person would fail if any availability row references
--    them as updated_by_person_id (NO ACTION blocks the delete).
alter table public.availability
  drop constraint if exists availability_updated_by_person_id_fkey;

alter table public.availability
  add constraint availability_updated_by_person_id_fkey
  foreign key (updated_by_person_id)
  references public.persons(id)
  on delete set null;
