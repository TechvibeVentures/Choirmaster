-- 006_indexes_perf.sql
-- Operational indexes for common read/write paths.

create index if not exists projects_choir_id_date_range_start_idx
  on public.projects (choir_id, date_range_start);

create index if not exists rehearsals_project_id_starts_at_idx
  on public.rehearsals (project_id, starts_at);

create index if not exists project_access_tokens_project_id_active_idx
  on public.project_access_tokens (project_id, active);

create index if not exists person_settings_active_choir_id_idx
  on public.person_settings (active_choir_id);

create index if not exists repertoire_pieces_choir_id_idx
  on public.repertoire_pieces (choir_id);

create index if not exists concert_programs_choir_id_status_idx
  on public.concert_programs (choir_id, status);

create index if not exists concert_programs_project_id_idx
  on public.concert_programs (project_id);

create index if not exists concert_program_pieces_program_id_sort_order_idx
  on public.concert_program_pieces (program_id, sort_order);
