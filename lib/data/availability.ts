import type { Availability, ProjectParticipation } from "@/lib/domain/types";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export const getProjectParticipantsByProjectIds = async (projectIds: string[]) => {
  if (!projectIds.length) return [] as ProjectParticipation[];

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_participants")
    .select("project_id, person_id, invite_status")
    .in("project_id", projectIds);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    project_id: row.project_id,
    person_id: row.person_id,
    invite_status: row.invite_status
  })) as ProjectParticipation[];
};

export const getAvailabilityByRehearsalIds = async (rehearsalIds: string[]) => {
  if (!rehearsalIds.length) return [] as Availability[];

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("availability")
    .select("rehearsal_id, person_id, status")
    .in("rehearsal_id", rehearsalIds);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    rehearsal_id: row.rehearsal_id,
    person_id: row.person_id,
    status: row.status
  })) as Availability[];
};
