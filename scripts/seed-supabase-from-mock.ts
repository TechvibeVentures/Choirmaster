import { DateTime } from "luxon";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../supabase";
import {
  availability,
  choirs,
  concertPrograms,
  concertsByProject,
  memberships,
  people,
  projectParticipations,
  projects,
  rehearsalsByProject,
  repertoirePieces
} from "../lib/mockData";

loadEnvConfig(process.cwd());

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const isMissingTable = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "42P01" || code === "42703";
};

const mapVoice = (value: string | undefined | null) => {
  if (!value) return null;
  if (value === "Soprano" || value === "Alto" || value === "Tenor" || value === "Bass") {
    return value;
  }
  if (value === "Sopran") return "Soprano";
  if (value === "Alt") return "Alto";
  return null;
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
  persons: 0,
  choirs: 0,
  memberships: 0,
  projects: 0,
  rehearsals: 0,
  participants: 0,
  availabilities: 0,
  repertoirePieces: 0,
  concertPrograms: 0,
  concertProgramPieces: 0
};

const run = async () => {
  const choirIdByMockId = new Map<string, string>();
  const personIdByMockId = new Map<string, string>();
  const projectIdByMockId = new Map<string, string>();
  const rehearsalIdByMockId = new Map<string, string>();
  const repertoireIdByKey = new Map<string, string>();

  for (const choir of choirs) {
    const existing = await db
      .from("choirs")
      .select("id")
      .eq("name", choir.name)
      .eq("city", choir.city)
      .maybeSingle();

    if (existing.error) throw existing.error;

    if (existing.data) {
      choirIdByMockId.set(choir.id, existing.data.id);

      const updated = await db
        .from("choirs")
        .update({
          type: choir.type,
          genres: choir.genres,
          rehearsal_weekdays: choir.rehearsal_pattern.weekdays,
          rehearsal_start_time: choir.rehearsal_pattern.start_time,
          rehearsal_end_time: choir.rehearsal_pattern.end_time,
          default_location: choir.rehearsal_pattern.default_location || null
        })
        .eq("id", existing.data.id);

      if (updated.error) throw updated.error;
      continue;
    }

    const inserted = await db
      .from("choirs")
      .insert({
        name: choir.name,
        city: choir.city,
        type: choir.type,
        genres: choir.genres,
        rehearsal_weekdays: choir.rehearsal_pattern.weekdays,
        rehearsal_start_time: choir.rehearsal_pattern.start_time,
        rehearsal_end_time: choir.rehearsal_pattern.end_time,
        default_location: choir.rehearsal_pattern.default_location || null
      })
      .select("id")
      .single();

    if (inserted.error) throw inserted.error;

    choirIdByMockId.set(choir.id, inserted.data.id);
    stats.choirs += 1;
  }

  for (const person of people) {
    const upserted = await db
      .from("persons")
      .upsert(
        {
          email: person.email.toLowerCase(),
          first_name: person.first_name,
          last_name: person.last_name,
          phone: person.phone || null,
          city: person.city || null,
          experience_level: person.experience_level,
          tags: person.tags
        },
        { onConflict: "email" }
      )
      .select("id")
      .single();

    if (upserted.error) throw upserted.error;

    personIdByMockId.set(person.id, upserted.data.id);
    stats.persons += 1;
  }

  for (const membership of memberships) {
    const choirId = choirIdByMockId.get(membership.choir_id);
    const personId = personIdByMockId.get(membership.person_id);

    if (!choirId || !personId) continue;

    const sourcePerson = people.find((person) => person.id === membership.person_id);

    const upserted = await db
      .from("choir_memberships")
      .upsert(
        {
          choir_id: choirId,
          person_id: personId,
          roles: sourcePerson?.roles || ["singer"],
          singer_status: membership.singer_status,
          voice: membership.voice
        },
        { onConflict: "choir_id,person_id" }
      )
      .select("id")
      .single();

    if (upserted.error) throw upserted.error;
    stats.memberships += 1;
  }

  const personSettingsDb = db as any;
  for (const person of people) {
    const personId = personIdByMockId.get(person.id);
    const personMembership = memberships.find((item) => item.person_id === person.id);
    const activeChoirId = personMembership
      ? choirIdByMockId.get(personMembership.choir_id)
      : null;

    if (!personId || !activeChoirId) continue;

    const settings = await personSettingsDb
      .from("person_settings")
      .upsert(
        {
          person_id: personId,
          timezone: "Europe/Zurich",
          language: "Deutsch",
          active_choir_id: activeChoirId
        },
        { onConflict: "person_id" }
      );

    if (settings.error && !isMissingTable(settings.error)) {
      throw settings.error;
    }
  }

  for (const project of projects) {
    const choirId = choirIdByMockId.get(project.choir_id);
    if (!choirId) continue;

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
        rehearsalIdByMockId.set(rehearsal.id, existing.data.id);
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

      rehearsalIdByMockId.set(rehearsal.id, inserted.data.id);
      stats.rehearsals += 1;
    }
  }

  for (const participant of projectParticipations) {
    const projectId = projectIdByMockId.get(participant.project_id);
    const personId = personIdByMockId.get(participant.person_id);

    if (!projectId || !personId) continue;

    const upserted = await db
      .from("project_participants")
      .upsert(
        {
          project_id: projectId,
          person_id: personId,
          invite_status: participant.invite_status
        },
        { onConflict: "project_id,person_id" }
      )
      .select("id")
      .single();

    if (upserted.error) throw upserted.error;
    stats.participants += 1;
  }

  for (const item of availability) {
    const rehearsalId = rehearsalIdByMockId.get(item.rehearsal_id);
    const personId = personIdByMockId.get(item.person_id);

    if (!rehearsalId || !personId) continue;

    const upserted = await db
      .from("availability")
      .upsert(
        {
          rehearsal_id: rehearsalId,
          person_id: personId,
          status: item.status,
          updated_by_kind: "admin"
        },
        { onConflict: "rehearsal_id,person_id" }
      )
      .select("id")
      .single();

    if (upserted.error) throw upserted.error;
    stats.availabilities += 1;
  }

  const anyDb = db as any;

  for (const piece of repertoirePieces) {
    const choirId = choirIdByMockId.get(piece.choir_id);
    if (!choirId) continue;

    const upserted = await anyDb
      .from("repertoire_pieces")
      .upsert(
        {
          choir_id: choirId,
          title: piece.title,
          composer: piece.composer,
          era: piece.era || null
        },
        { onConflict: "choir_id,title,composer" }
      )
      .select("id, choir_id, title, composer")
      .single();

    if (upserted.error) {
      if (isMissingTable(upserted.error)) break;
      throw upserted.error;
    }

    const key = `${upserted.data.choir_id}|${upserted.data.title}|${upserted.data.composer}`;
    repertoireIdByKey.set(key, upserted.data.id);
    stats.repertoirePieces += 1;
  }

  for (const program of concertPrograms) {
    const choirId = choirIdByMockId.get(program.choir_id);
    const projectId = program.project_id
      ? projectIdByMockId.get(program.project_id) || null
      : null;

    if (!choirId) continue;

    const upsertedProgram = await anyDb
      .from("concert_programs")
      .upsert(
        {
          choir_id: choirId,
          project_id: projectId,
          title: program.title,
          season: program.season,
          status: program.status
        },
        { onConflict: "choir_id,title,season" }
      )
      .select("id")
      .single();

    if (upsertedProgram.error) {
      if (isMissingTable(upsertedProgram.error)) break;
      throw upsertedProgram.error;
    }

    const programId = upsertedProgram.data.id;
    stats.concertPrograms += 1;

    const sortedPieces = [...program.pieces].map((piece, index) => ({
      ...piece,
      sort_order: index + 1
    }));

    for (const piece of sortedPieces) {
      const repertoireKey = `${choirId}|${piece.title}|${piece.composer}`;
      const repertoirePieceId = repertoireIdByKey.get(repertoireKey) || null;

      const upsertedPiece = await anyDb
        .from("concert_program_pieces")
        .upsert(
          {
            program_id: programId,
            repertoire_piece_id: repertoirePieceId,
            title: piece.title,
            composer: piece.composer,
            duration: piece.duration || null,
            pdf_url: piece.pdf_url,
            recording_url: piece.recording_url,
            sort_order: piece.sort_order
          },
          { onConflict: "program_id,sort_order,title" }
        )
        .select("id")
        .single();

      if (upsertedPiece.error) {
        if (isMissingTable(upsertedPiece.error)) break;
        throw upsertedPiece.error;
      }

      stats.concertProgramPieces += 1;
    }
  }

  console.log("Seed completed:");
  console.table(stats);
};

run().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
