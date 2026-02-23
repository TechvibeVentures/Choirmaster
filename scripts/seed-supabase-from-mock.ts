import { DateTime } from "luxon";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../supabase";
import {
  concertsByProject,
  projects,
  rehearsalsByProject
} from "../lib/mockProjectsData";

loadEnvConfig(process.cwd());

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const toUtcIso = (date: string, time: string) => {
  const local = DateTime.fromFormat(`${date} ${time}`, "yyyy-MM-dd HH:mm", {
    zone: "Europe/Zurich"
  });

  if (!local.isValid) {
    throw new Error(`Invalid local datetime: ${date} ${time}`);
  }

  return local.toUTC().toISO({ suppressMilliseconds: true });
};

const db = createClient<Database>(
  getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const stats = {
  projects: 0,
  rehearsals: 0
};

const run = async () => {
  const projectIdByMockId = new Map<string, string>();
  const seedChoirId = process.env.SEED_CHOIR_ID;

  const choirId = seedChoirId
    ? (
        await db.from("choirs").select("id").eq("id", seedChoirId).maybeSingle()
      ).data?.id || ""
    : (await db.from("choirs").select("id").limit(1).maybeSingle()).data?.id || "";

  if (!choirId) {
    throw new Error(
      "No choir found to attach projects to. Create a choir first (via the app) or set SEED_CHOIR_ID."
    );
  }

  for (const project of projects) {
    const existing = await db
      .from("projects")
      .select("id")
      .eq("choir_id", choirId)
      .eq("name", project.name)
      .eq("date_range_start", project.date_range.start)
      .eq("date_range_end", project.date_range.end)
      .maybeSingle();

    if (existing.error) throw existing.error;

    const concerts = (concertsByProject[project.id] || []).map((concert) => ({
      date: concert.date,
      time: concert.time,
      place: concert.place
    }));

    if (existing.data) {
      projectIdByMockId.set(project.id, existing.data.id);

      const updated = await db
        .from("projects")
        .update({
          description: project.description || null,
          link: project.link || null,
          concerts
        })
        .eq("id", existing.data.id);

      if (updated.error) throw updated.error;
      continue;
    }

    const inserted = await db
      .from("projects")
      .insert({
        choir_id: choirId,
        name: project.name,
        description: project.description || null,
        link: project.link || null,
        date_range_start: project.date_range.start,
        date_range_end: project.date_range.end,
        concerts
      })
      .select("id")
      .single();

    if (inserted.error) throw inserted.error;

    projectIdByMockId.set(project.id, inserted.data.id);
    stats.projects += 1;
  }

  for (const [mockProjectId, rehearsals] of Object.entries(rehearsalsByProject)) {
    const projectId = projectIdByMockId.get(mockProjectId);
    if (!projectId) continue;

    for (const rehearsal of rehearsals) {
      const startsAt = toUtcIso(rehearsal.date, rehearsal.start_time);
      const endsAt = toUtcIso(rehearsal.date, rehearsal.end_time);

      const existing = await db
        .from("rehearsals")
        .select("id")
        .eq("project_id", projectId)
        .eq("starts_at", startsAt)
        .eq("ends_at", endsAt)
        .eq("location", rehearsal.location)
        .maybeSingle();

      if (existing.error) throw existing.error;

      if (existing.data) {
        continue;
      }

      const inserted = await db
        .from("rehearsals")
        .insert({
          project_id: projectId,
          starts_at: startsAt,
          ends_at: endsAt,
          location: rehearsal.location
        })
        .select("id")
        .single();

      if (inserted.error) throw inserted.error;

      stats.rehearsals += 1;
    }
  }

  console.log("Seed completed:");
  console.table(stats);
};

run().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
