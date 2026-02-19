import type { Concert, Project, Weekday } from "@/lib/domain/types";
import { convertProjectConcerts, mapRehearsalFacts, normalizeWeekdays } from "@/lib/data/common";
import { getServerSupabaseClient } from "@/lib/supabase/server";

type ProjectRow = {
  id: string;
  choir_id: string;
  name: string;
  description: string | null;
  link: string | null;
  date_range_start: string;
  date_range_end: string;
  concerts: unknown;
};

export const getProjectsByChoirIds = async (choirIds: string[]) => {
  if (!choirIds.length) return [] as ProjectRow[];

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, choir_id, name, description, link, date_range_start, date_range_end, concerts"
    )
    .in("choir_id", choirIds)
    .order("date_range_start", { ascending: true });

  if (error) throw error;

  return (data || []) as ProjectRow[];
};

export const mapProjectsForUi = (
  projectRows: ProjectRow[],
  choirsById: Map<string, { weekdays: Weekday[]; start: string; end: string; location: string }>,
  rehearsalsByProject: Record<string, import("@/lib/domain/types").Rehearsal[]>
): Project[] => {
  return projectRows.map((row) => {
    const choirDefaults = choirsById.get(row.choir_id) || {
      weekdays: ["Tue"] as Weekday[],
      start: "19:30",
      end: "21:30",
      location: ""
    };

    const rehearsalFacts = mapRehearsalFacts(
      rehearsalsByProject[row.id] || [],
      normalizeWeekdays(choirDefaults.weekdays),
      choirDefaults.start,
      choirDefaults.end,
      choirDefaults.location
    );

    return {
      id: row.id,
      choir_id: row.choir_id,
      name: row.name,
      description: row.description || undefined,
      link: row.link || undefined,
      date_range: {
        start: row.date_range_start,
        end: row.date_range_end
      },
      rehearsal_facts: rehearsalFacts
    };
  });
};

export const mapConcertsByProject = (projectRows: ProjectRow[]) => {
  return projectRows.reduce<Record<string, Concert[]>>((acc, row) => {
    acc[row.id] = convertProjectConcerts(row.id, row.concerts);
    return acc;
  }, {});
};
