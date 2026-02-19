-- 002_person_settings.sql
-- User-level preferences and active choir context.

create table if not exists public.person_settings (
  person_id uuid primary key
    references public.persons(id)
    on delete cascade,
  language text not null default 'Deutsch',
  timezone text not null default 'Europe/Zurich',
  notification_prefs jsonb not null default '{"digest":true,"reminders":true,"product_updates":false}'::jsonb,
  session_days integer not null default 90,
  mfa_enabled boolean not null default false,
  active_choir_id uuid null
    references public.choirs(id)
    on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint person_settings_session_days_check check (session_days > 0)
);

alter table public.person_settings enable row level security;

drop trigger if exists person_settings_updated_at on public.person_settings;
create trigger person_settings_updated_at
before update on public.person_settings
for each row
execute function public.set_updated_at();
