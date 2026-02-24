# Advisors preflight summary

## Security
- INFO `rls_enabled_no_policy`: `public.project_invites` has RLS enabled but no policies.
- WARN `function_search_path_mutable`: `public.set_updated_at`.
- WARN `auth_leaked_password_protection`.

## Performance (targeted in plan)
- INFO `unindexed_foreign_keys` on:
  - `public.availability(person_id)`
  - `public.availability(updated_by_person_id)`
  - `public.choir_memberships(person_id)`
  - `public.concert_program_pieces(repertoire_piece_id)`
  - `public.project_invites(choir_id)`
  - `public.project_invites(created_by_person_id)`
  - `public.project_participants(person_id)`

Other warnings (unused indexes / multiple permissive policies) left out of current scope.
