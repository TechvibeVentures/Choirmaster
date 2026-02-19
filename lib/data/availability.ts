import type { Availability, ProjectParticipation } from "@/lib/domain/types";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

const isProjectsPolicyRecursion = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  const message = (error as { message?: string }).message || "";
  return code === "42P17" && message.includes('relation "projects"');
};

export const getProjectParticipantsByProjectIds = async (
  projectIds: string[],
  context?: {
    currentPersonId?: string;
    adminProjectIds?: string[];
  }
) => {
  if (!projectIds.length) return [] as ProjectParticipation[];

  const serverDb = getServerSupabaseClient();
  const { data, error } = await serverDb
    .from("project_participants")
    .select("project_id, person_id, invite_status")
    .in("project_id", projectIds);

  if (error && !isProjectsPolicyRecursion(error)) throw error;

  if (error && isProjectsPolicyRecursion(error)) {
    const serviceDb = getServiceSupabaseClient();
    const fallback = await serviceDb
      .from("project_participants")
      .select("project_id, person_id, invite_status")
      .in("project_id", projectIds);

    if (fallback.error) throw fallback.error;
    const currentPersonId = context?.currentPersonId || "";
    const adminProjectSet = new Set(context?.adminProjectIds || []);

    const filtered = (fallback.data || []).filter((row: any) => {
      if (adminProjectSet.has(row.project_id)) return true;
      if (!currentPersonId) return false;
      return row.person_id === currentPersonId;
    });

    return filtered.map((row: any) => ({
      project_id: row.project_id,
      person_id: row.person_id,
      invite_status: row.invite_status
    })) as ProjectParticipation[];
  }

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
