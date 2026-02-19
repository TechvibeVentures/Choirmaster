import type { Choir, ChoirMembership, Voice } from "@/lib/domain/types";
import {
  mapMembershipRolesToPeopleRoles,
  normalizeChoirType,
  normalizeVoice,
  normalizeWeekdays
} from "@/lib/data/common";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export const getCurrentPersonMemberships = async (personId: string) => {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("choir_memberships")
    .select("id, choir_id, person_id, roles, singer_status, voice")
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
      "id, name, city, type, genres, rehearsal_weekdays, rehearsal_start_time, rehearsal_end_time, default_location"
    )
    .in("id", choirIds);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    type: normalizeChoirType(row.type),
    genres: row.genres || [],
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
    .select("choir_id, person_id, roles, singer_status, voice")
    .in("choir_id", choirIds);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    choir_id: row.choir_id,
    person_id: row.person_id,
    roles: row.roles || [],
    singer_status: (row.singer_status || "active") as "active" | "inactive" | "project_only",
    voice: normalizeVoice(row.voice) as Voice
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
