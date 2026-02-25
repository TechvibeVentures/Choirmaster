import type { Choir, ChoirMembership, Voice } from "@/lib/domain/types";
import {
  mapMembershipRolesToPeopleRoles,
  normalizeChoirType,
  normalizeWeekdays
} from "@/lib/data/common";
import {
  normalizeVoiceDistribution
} from "@/lib/domain/voiceDistribution";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const normalizeOptionalVoice = (value: string | null | undefined): Voice | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "soprano" || normalized === "sopran") return "Soprano";
  if (normalized === "alto" || normalized === "alt") return "Alto";
  if (normalized === "tenor") return "Tenor";
  if (normalized === "bass" || normalized === "basso") return "Bass";
  return null;
};

export const getCurrentPersonMemberships = async (personId: string) => {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("choir_memberships")
    .select("id, choir_id, person_id, roles, singer_status")
    .eq("person_id", personId);

  if (error) throw error;
  return data || [];
};

export const getChoirsByIds = async (choirIds: string[]) => {
  if (!choirIds.length) return [] as Choir[];

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("choirs")
    .select(
      "id, name, city, type, genres, voice_distribution, rehearsal_weekdays, rehearsal_start_time, rehearsal_end_time, default_location"
    )
    .in("id", choirIds);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    type: normalizeChoirType(row.type),
    genres: row.genres || [],
    voice_distribution: normalizeVoiceDistribution(row.voice_distribution),
    rehearsal_pattern: {
      weekdays: normalizeWeekdays(row.rehearsal_weekdays),
      start_time: row.rehearsal_start_time,
      end_time: row.rehearsal_end_time,
      default_location: row.default_location || undefined
    }
  })) as Choir[];
};

export const getChoirMembershipsByChoirIds = async (choirIds: string[]) => {
  if (!choirIds.length) return [] as ChoirMembership[];

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("choir_memberships")
    .select("choir_id, person_id, roles, singer_status")
    .in("choir_id", choirIds);

  if (error) throw error;

  const personIds = Array.from(
    new Set((data || []).map((row: any) => row.person_id))
  ) as string[];
  let voiceByPersonId = new Map<string, Voice | null>();

  if (personIds.length) {
    const personsRes = await supabase
      .from("persons")
      .select("id, voice")
      .in("id", personIds);

    if (personsRes.error) throw personsRes.error;

    voiceByPersonId = new Map(
      (personsRes.data || []).map((row: any) => [
        row.id,
        normalizeOptionalVoice(row.voice)
      ])
    );
  }

  return (data || []).map((row: any) => ({
    choir_id: row.choir_id,
    person_id: row.person_id,
    roles: row.roles || [],
    singer_status: (row.singer_status || "active") as "active" | "inactive" | "project_only",
    voice: voiceByPersonId.get(row.person_id) || "Soprano"
  })) as ChoirMembership[];
};

export const enrichPeopleRolesFromMemberships = (
  personId: string,
  memberships: ChoirMembership[]
) => {
  const roles = memberships
    .filter((item) => item.person_id === personId)
    .flatMap((item) => item.roles || []);
  return mapMembershipRolesToPeopleRoles(roles);
};
