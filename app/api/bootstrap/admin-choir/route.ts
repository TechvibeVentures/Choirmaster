import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { ZodError } from "zod";
import { bootstrapAdminChoirSchema } from "@/lib/apiSchemas";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

const roleMap: Record<"chair" | "conductor" | "manager", string> = {
  chair: "chairman",
  conductor: "conductor",
  manager: "manager"
};
const isAdminMembershipRole = (role: string) =>
  role === "chairman" || role === "conductor" || role === "manager";

const weekdayToLuxon: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7
};

const buildRehearsalRows = ({
  projectId,
  timezone,
  startDate,
  endDate,
  weekdays,
  startTime,
  endTime,
  location
}: {
  projectId: string;
  timezone: string;
  startDate: string;
  endDate: string;
  weekdays: string[];
  startTime: string;
  endTime: string;
  location: string;
}) => {
  const start = DateTime.fromISO(startDate, { zone: timezone }).startOf("day");
  const end = DateTime.fromISO(endDate, { zone: timezone }).startOf("day");

  if (!start.isValid || !end.isValid || end < start) return [];

  const validWeekdays = Array.from(
    new Set(
      (weekdays || [])
        .map((day) => day.trim())
        .filter((day) => weekdayToLuxon[day] !== undefined)
    )
  );
  const fallbackWeekdays = validWeekdays.length ? validWeekdays : ["Tue"];
  const weekdaySet = new Set(fallbackWeekdays.map((day) => weekdayToLuxon[day]));

  const rows: Array<{
    project_id: string;
    starts_at: string;
    ends_at: string;
    location: string | null;
  }> = [];

  for (let cursor = start; cursor <= end; cursor = cursor.plus({ days: 1 })) {
    if (!weekdaySet.has(cursor.weekday)) continue;

    const dateIso = cursor.toISODate();
    if (!dateIso) continue;

    let startsLocal = DateTime.fromISO(`${dateIso}T${startTime}`, {
      zone: timezone
    });
    let endsLocal = DateTime.fromISO(`${dateIso}T${endTime}`, {
      zone: timezone
    });

    if (!startsLocal.isValid || !endsLocal.isValid) {
      startsLocal = DateTime.fromISO(`${dateIso}T19:30`, { zone: timezone });
      endsLocal = DateTime.fromISO(`${dateIso}T21:30`, { zone: timezone });
    }

    if (endsLocal <= startsLocal) {
      endsLocal = endsLocal.plus({ days: 1 });
    }

    const startsAt = startsLocal.toUTC().toISO();
    const endsAt = endsLocal.toUTC().toISO();
    if (!startsAt || !endsAt) continue;

    rows.push({
      project_id: projectId,
      starts_at: startsAt,
      ends_at: endsAt,
      location: location || null
    });
  }

  return rows;
};

export async function POST(request: Request) {
  try {
    const session = await getCurrentSessionPerson();
    if (!session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = bootstrapAdminChoirSchema.parse(await request.json());
    const service = getServiceSupabaseClient();
    const anyDb = service as any;
    const currentMetadata = (session.user.user_metadata || {}) as Record<string, unknown>;

    const metadataFirstName =
      typeof currentMetadata.first_name === "string"
        ? currentMetadata.first_name.trim()
        : "";
    const metadataLastName =
      typeof currentMetadata.last_name === "string"
        ? currentMetadata.last_name.trim()
        : "";

    const firstName = payload.profile.first_name.trim() || metadataFirstName;
    const lastName = payload.profile.last_name.trim() || metadataLastName;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    const authSync = await service.auth.admin.updateUserById(session.user.id, {
      user_metadata: {
        ...currentMetadata,
        first_name: firstName,
        last_name: lastName
      }
    });

    if (authSync.error) {
      throw authSync.error;
    }

    let personId = session.person?.id;

    if (!personId) {
      const insertPayload: Record<string, unknown> = {
        email: session.user.email,
        first_name: firstName,
        last_name: lastName,
        city: payload.profile.city,
        experience_level: "professional",
        tags: ["Leitung"],
        voice: "Soprano"
      };

      insertPayload.auth_user_id = session.user.id;

      const created = await anyDb
        .from("persons")
        .insert(insertPayload)
        .select("id")
        .single();

      if (created.error) {
        throw created.error;
      }
      personId = created.data.id;
    } else {
      const updatePayload: Record<string, unknown> = {
        email: session.user.email,
        first_name: firstName,
        last_name: lastName,
        city: payload.profile.city,
        auth_user_id: session.user.id
      };

      const updated = await anyDb
        .from("persons")
        .update(updatePayload)
        .eq("id", personId)
        .select("id")
        .single();

      if (updated.error) {
        throw updated.error;
      }
    }

    const desiredChoirName = payload.choir.name.trim().toLowerCase();
    let choirId = "";
    let reusedExistingChoir = false;

    const existingMembershipsRes = await service
      .from("choir_memberships")
      .select("choir_id, roles")
      .eq("person_id", personId);

    if (existingMembershipsRes.error) {
      throw existingMembershipsRes.error;
    }

    const adminChoirIds = Array.from(
      new Set(
        (existingMembershipsRes.data || [])
          .filter((row) => (row.roles || []).some((role) => isAdminMembershipRole(role)))
          .map((row) => row.choir_id)
      )
    );

    if (adminChoirIds.length > 0) {
      const existingChoirsRes = await service
        .from("choirs")
        .select("id, name")
        .in("id", adminChoirIds);

      if (existingChoirsRes.error) {
        throw existingChoirsRes.error;
      }

      const matchingChoir = (existingChoirsRes.data || []).find(
        (choir) => choir.name.trim().toLowerCase() === desiredChoirName
      );

      if (matchingChoir) {
        const choirUpdateRes = await service
          .from("choirs")
          .update({
            city: payload.choir.city,
            type: payload.choir.type,
            genres: payload.choir.genres,
            voice_distribution: payload.choir.voice_distribution,
            rehearsal_weekdays: payload.choir.rehearsal_weekdays,
            rehearsal_start_time: payload.choir.rehearsal_start_time,
            rehearsal_end_time: payload.choir.rehearsal_end_time,
            default_location: payload.choir.default_location || null
          })
          .eq("id", matchingChoir.id)
          .select("id")
          .single();

        if (choirUpdateRes.error) throw choirUpdateRes.error;
        choirId = choirUpdateRes.data.id;
        reusedExistingChoir = true;
      }
    }

    if (!choirId) {
      const choirRes = await service
        .from("choirs")
        .insert({
          name: payload.choir.name,
          city: payload.choir.city,
          type: payload.choir.type,
          genres: payload.choir.genres,
          voice_distribution: payload.choir.voice_distribution,
          rehearsal_weekdays: payload.choir.rehearsal_weekdays,
          rehearsal_start_time: payload.choir.rehearsal_start_time,
          rehearsal_end_time: payload.choir.rehearsal_end_time,
          default_location: payload.choir.default_location || null
        })
        .select("id")
        .single();

      if (choirRes.error) throw choirRes.error;
      choirId = choirRes.data.id;
    }

    const membershipRes = await service
      .from("choir_memberships")
      .upsert(
        {
          choir_id: choirId,
          person_id: personId,
          roles: [roleMap[payload.profile.role], "manager"],
          singer_status: "active"
        },
        { onConflict: "choir_id,person_id" }
      )
      .select("id")
      .single();

    if (membershipRes.error) throw membershipRes.error;

    const settingsRes = await anyDb
      .from("person_settings")
      .upsert(
        {
          person_id: personId,
          language: payload.profile.language,
          timezone: payload.profile.timezone,
          active_choir_id: choirId
        },
        { onConflict: "person_id" }
      )
      .select("person_id")
      .single();

    if (settingsRes.error) {
      throw settingsRes.error;
    }

    let projectId = "";
    let projectAccessToken = "";

    if (payload.createDefaultProject && !reusedExistingChoir) {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 90);
      const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

      const projectRes = await service
        .from("projects")
        .insert({
          choir_id: choirId,
          name: "Neues Projekt",
          description: "Projekt wurde beim Onboarding erstellt.",
          date_range_start: toIsoDate(today),
          date_range_end: toIsoDate(endDate),
          concerts: []
        })
        .select("id")
        .single();

      if (projectRes.error) throw projectRes.error;
      projectId = projectRes.data.id;

      const rehearsalRows = buildRehearsalRows({
        projectId,
        timezone: payload.profile.timezone || "Europe/Zurich",
        startDate: toIsoDate(today),
        endDate: toIsoDate(endDate),
        weekdays: payload.choir.rehearsal_weekdays,
        startTime: payload.choir.rehearsal_start_time,
        endTime: payload.choir.rehearsal_end_time,
        location: payload.choir.default_location || ""
      });

      if (rehearsalRows.length) {
        const rehearsalsRes = await service.from("rehearsals").insert(rehearsalRows);
        if (rehearsalsRes.error) throw rehearsalsRes.error;
      }

      const tokenRes = await service
        .from("project_access_tokens")
        .insert({
          project_id: projectId,
          active: true
        })
        .select("token")
        .single();

      if (tokenRes.error) throw tokenRes.error;
      projectAccessToken = tokenRes.data.token;
    }

    return NextResponse.json({
      personId,
      choirId,
      projectId,
      activeChoirId: choirId,
      projectAccessToken
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", details: error.issues },
        { status: 400 }
      );
    }
    console.error("bootstrap/admin-choir error", error);
    return NextResponse.json(
      { error: "Failed to bootstrap admin choir" },
      { status: 500 }
    );
  }
}
