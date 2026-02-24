# Advisors postflight summary

## Security
- `rls_enabled_no_policy` on `public.project_invites`: resolved.
- Remaining warnings (outside current scope):
  - `function_search_path_mutable` on `public.set_updated_at`
  - `auth_leaked_password_protection`

## Performance
- `unindexed_foreign_keys` warnings for the 7 targeted FK columns: resolved.
- New indexes currently appear as `unused_index` (expected immediately after creation).
- Existing `multiple_permissive_policies` warnings remain out of scope.
