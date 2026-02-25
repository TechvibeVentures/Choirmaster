-- 017_choir_voice_distribution.sql
-- Persist per-choir voice distribution and validate shape/content.

create or replace function public.is_valid_voice_distribution(p_value jsonb)
returns boolean
language plpgsql
immutable
as $function$
declare
  v_voice text;
  v_slots jsonb;
  v_slot jsonb;
  v_index integer;
  v_raw text;
  v_key_count integer;
begin
  if p_value is null or jsonb_typeof(p_value) <> 'object' then
    return false;
  end if;

  select count(*) into v_key_count
  from jsonb_object_keys(p_value);

  if v_key_count <> 4 then
    return false;
  end if;

  foreach v_voice in array array['Soprano', 'Alto', 'Tenor', 'Bass'] loop
    if not (p_value ? v_voice) then
      return false;
    end if;

    v_slots := p_value -> v_voice;
    if jsonb_typeof(v_slots) <> 'array' or jsonb_array_length(v_slots) <> 3 then
      return false;
    end if;

    for v_index in 0..2 loop
      v_slot := v_slots -> v_index;
      if jsonb_typeof(v_slot) <> 'number' then
        return false;
      end if;

      v_raw := v_slot #>> '{}';
      if v_raw !~ '^[0-9]+$' then
        return false;
      end if;

      if v_raw::integer < 0 then
        return false;
      end if;
    end loop;
  end loop;

  return true;
exception
  when others then
    return false;
end;
$function$;

alter table public.choirs
  add column if not exists voice_distribution jsonb;

alter table public.choirs
  alter column voice_distribution set default '{"Soprano":[4,4,0],"Alto":[4,4,0],"Tenor":[4,4,0],"Bass":[4,4,0]}'::jsonb;

update public.choirs
set voice_distribution = '{"Soprano":[4,4,0],"Alto":[4,4,0],"Tenor":[4,4,0],"Bass":[4,4,0]}'::jsonb
where voice_distribution is null;

alter table public.choirs
  alter column voice_distribution set not null;

alter table public.choirs
  drop constraint if exists choirs_voice_distribution_check;

alter table public.choirs
  add constraint choirs_voice_distribution_check
  check (public.is_valid_voice_distribution(voice_distribution));
