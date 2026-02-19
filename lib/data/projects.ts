import type { Concert, Project, Weekday } from "@/lib/domain/types";
import { convertProjectConcerts, mapRehearsalFacts, normalizeWeekdays } from "@/lib/data/common";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

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

const isProjectsPolicyRecursion = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  const message = (error as { message?: string }).message || "";
  return code === "42P17" && message.includes('relation "projects"');
};

export const getProjectsByChoirIds = async (
  choirIds: string[],
  context?: {
    currentPersonId?: string;
    adminChoirIds?: string[];
  }
) => {
  if (!choirIds.length) return [] as ProjectRow[];

  const serverDb = getServerSupabaseClient();
  const { data, error } = await serverDb
    .from("projects")
    .select(
      "id, choir_id, name, description, link, date_range_start, date_range_end, concerts"
    )
    .in("choir_id", choirIds)
    .order("date_range_start", { ascending: true });

  if (error && !isProjectsPolicyRecursion(error)) {
    throw error;
  }

  if (error && isProjectsPolicyRecursion(error)) {
    const serviceDb = getServiceSupabaseClient();
    const serviceQuery = await serviceDb
      .from("projects")
      .select(
        "id, choir_id, name, description, link, date_range_start, date_range_end, concerts"
      )
      .in("choir_id", choirIds)
      .order("date_range_start", { ascending: true });

    if (serviceQuery.error) throw serviceQuery.error;

    const rows = (serviceQuery.data || []) as ProjectRow[];
    const currentPersonId = context?.currentPersonId || "";
    const adminChoirSet = new Set(context?.adminChoirIds || []);

    if (!currentPersonId) {
      return rows.filter((row) => adminChoirSet.has(row.choir_id));
    }

    const candidateProjectIds = rows.map((row) => row.id);
    if (!candidateProjectIds.length) return [];

    const participantRes = await serviceDb
      .from("project_participants")
      .select("project_id")
      .in("project_id", candidateProjectIds)
      .eq("person_id", currentPersonId);

    if (participantRes.error) throw participantRes.error;
    const participantProjectSet = new Set(
      (participantRes.data || []).map((item: { project_id: string }) => item.project_id)
    );

    return rows.filter(
      (row) => adminChoirSet.has(row.choir_id) || participantProjectSet.has(row.id)
    );
  }

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
