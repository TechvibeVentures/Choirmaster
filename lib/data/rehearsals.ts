import type { Rehearsal } from "@/lib/domain/types";
import { toLocalDateTimeParts } from "@/lib/data/common";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

const isProjectsPolicyRecursion = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  const message = (error as { message?: string }).message || "";
  return code === "42P17" && message.includes('relation "projects"');
};

export const getRehearsalsByProjectIds = async (
  projectIds: string[],
  timezone: string
) => {
  if (!projectIds.length) return [] as Rehearsal[];

  const serverDb = getServerSupabaseClient();
  const { data, error } = await serverDb
    .from("rehearsals")
    .select("id, project_id, starts_at, ends_at, location")
    .in("project_id", projectIds)
    .order("starts_at", { ascending: true });

  if (error && !isProjectsPolicyRecursion(error)) throw error;

  const rows = data || [];
  if (error && isProjectsPolicyRecursion(error)) {
    const serviceDb = getServiceSupabaseClient();
    const fallback = await serviceDb
      .from("rehearsals")
      .select("id, project_id, starts_at, ends_at, location")
      .in("project_id", projectIds)
      .order("starts_at", { ascending: true });

    if (fallback.error) throw fallback.error;
    return (fallback.data || []).map((row: any) => {
      const start = toLocalDateTimeParts(row.starts_at, timezone);
      const end = toLocalDateTimeParts(row.ends_at, timezone);
      return {
        id: row.id,
        project_id: row.project_id,
        date: start.date,
        start_time: start.time,
        end_time: end.time,
        location: row.location || ""
      };
    }) as Rehearsal[];
  }

  return rows.map((row: any) => {
    const start = toLocalDateTimeParts(row.starts_at, timezone);
    const end = toLocalDateTimeParts(row.ends_at, timezone);
    return {
      id: row.id,
      project_id: row.project_id,
      date: start.date,
      start_time: start.time,
      end_time: end.time,
      location: row.location || ""
    };
  }) as Rehearsal[];
};
