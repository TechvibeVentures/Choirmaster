-- 003_repertoire.sql
-- Repertoire library + concert programs per choir/project.

create table if not exists public.repertoire_pieces (
  id uuid primary key default gen_random_uuid(),
  choir_id uuid not null
    references public.choirs(id)
    on delete cascade,
  title text not null,
  composer text not null,
  era text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repertoire_pieces_choir_title_composer_key unique (choir_id, title, composer)
);

create table if not exists public.concert_programs (
  id uuid primary key default gen_random_uuid(),
  choir_id uuid not null
    references public.choirs(id)
    on delete cascade,
  project_id uuid null
    references public.projects(id)
    on delete set null,
  title text not null,
  season text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint concert_programs_status_check check (status in ('current', 'archived', 'draft')),
  constraint concert_programs_choir_title_season_key unique (choir_id, title, season)
);

create table if not exists public.concert_program_pieces (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null
    references public.concert_programs(id)
    on delete cascade,
  repertoire_piece_id uuid null
    references public.repertoire_pieces(id)
    on delete set null,
  title text not null,
  composer text not null,
  duration text,
  pdf_url text not null default '',
  recording_url text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint concert_program_pieces_program_sort_title_key unique (program_id, sort_order, title)
);

alter table public.repertoire_pieces enable row level security;
alter table public.concert_programs enable row level security;
alter table public.concert_program_pieces enable row level security;

drop trigger if exists repertoire_pieces_updated_at on public.repertoire_pieces;
create trigger repertoire_pieces_updated_at
before update on public.repertoire_pieces
for each row
execute function public.set_updated_at();

drop trigger if exists concert_programs_updated_at on public.concert_programs;
create trigger concert_programs_updated_at
before update on public.concert_programs
for each row
execute function public.set_updated_at();

drop trigger if exists concert_program_pieces_updated_at on public.concert_program_pieces;
create trigger concert_program_pieces_updated_at
before update on public.concert_program_pieces
for each row
execute function public.set_updated_at();
