-- 004_rls_repertoire_settings.sql
-- RLS for settings + repertoire/program tables.

alter table public.person_settings enable row level security;
alter table public.repertoire_pieces enable row level security;
alter table public.concert_programs enable row level security;
alter table public.concert_program_pieces enable row level security;

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
      and (
        admin_m.roles @> array['chairman']::text[]
        or admin_m.roles @> array['conductor']::text[]
      )
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
      and (
        admin_m.roles @> array['chairman']::text[]
        or admin_m.roles @> array['conductor']::text[]
      )
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
      and (
        admin_m.roles @> array['chairman']::text[]
        or admin_m.roles @> array['conductor']::text[]
      )
  )
);

drop policy if exists repertoire_pieces_select_member on public.repertoire_pieces;
create policy repertoire_pieces_select_member
on public.repertoire_pieces
for select
using (public.is_member(choir_id));

drop policy if exists repertoire_pieces_admin_write on public.repertoire_pieces;
create policy repertoire_pieces_admin_write
on public.repertoire_pieces
for all
using (public.is_admin(choir_id))
with check (public.is_admin(choir_id));

drop policy if exists concert_programs_select_member on public.concert_programs;
create policy concert_programs_select_member
on public.concert_programs
for select
using (public.is_member(choir_id));

drop policy if exists concert_programs_admin_write on public.concert_programs;
create policy concert_programs_admin_write
on public.concert_programs
for all
using (public.is_admin(choir_id))
with check (public.is_admin(choir_id));

drop policy if exists concert_program_pieces_select_member on public.concert_program_pieces;
create policy concert_program_pieces_select_member
on public.concert_program_pieces
for select
using (
  exists (
    select 1
    from public.concert_programs cp
    where cp.id = concert_program_pieces.program_id
      and public.is_member(cp.choir_id)
  )
);

drop policy if exists concert_program_pieces_admin_write on public.concert_program_pieces;
create policy concert_program_pieces_admin_write
on public.concert_program_pieces
for all
using (
  exists (
    select 1
    from public.concert_programs cp
    where cp.id = concert_program_pieces.program_id
      and public.is_admin(cp.choir_id)
  )
)
with check (
  exists (
    select 1
    from public.concert_programs cp
    where cp.id = concert_program_pieces.program_id
      and public.is_admin(cp.choir_id)
  )
);
