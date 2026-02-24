-- 016_fk_indexes_health.sql
-- Add missing FK indexes identified by database advisors.

create index if not exists availability_person_id_idx
  on public.availability (person_id);

create index if not exists availability_updated_by_person_id_idx
  on public.availability (updated_by_person_id);

create index if not exists choir_memberships_person_id_idx
  on public.choir_memberships (person_id);

create index if not exists concert_program_pieces_repertoire_piece_id_idx
  on public.concert_program_pieces (repertoire_piece_id);

create index if not exists project_invites_choir_id_idx
  on public.project_invites (choir_id);

create index if not exists project_invites_created_by_person_id_idx
  on public.project_invites (created_by_person_id);

create index if not exists project_participants_person_id_idx
  on public.project_participants (person_id);
