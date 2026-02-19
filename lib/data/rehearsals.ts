import type { Rehearsal } from "@/lib/domain/types";
import { toLocalDateTimeParts } from "@/lib/data/common";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export const getRehearsalsByProjectIds = async (
  projectIds: string[],
  timezone: string
) => {
  if (!projectIds.length) return [] as Rehearsal[];

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("rehearsals")
    .select("id, project_id, starts_at, ends_at, location")
    .in("project_id", projectIds)
    .order("starts_at", { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => {
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
