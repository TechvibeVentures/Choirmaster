import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { bootstrapAdminChoirSchema } from "@/lib/apiSchemas";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

const roleMap: Record<"chair" | "conductor" | "manager", string> = {
  chair: "chairman",
  conductor: "conductor",
  manager: "manager"
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
        tags: ["Leitung"]
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

    const choirRes = await service
      .from("choirs")
      .insert({
        name: payload.choir.name,
        city: payload.choir.city,
        type: payload.choir.type,
        genres: payload.choir.genres,
        rehearsal_weekdays: payload.choir.rehearsal_weekdays,
        rehearsal_start_time: payload.choir.rehearsal_start_time,
        rehearsal_end_time: payload.choir.rehearsal_end_time,
        default_location: payload.choir.default_location || null
      })
      .select("id")
      .single();

    if (choirRes.error) throw choirRes.error;

    const choirId = choirRes.data.id;

    const membershipRes = await service
      .from("choir_memberships")
      .upsert(
        {
          choir_id: choirId,
          person_id: personId,
          roles: [roleMap[payload.profile.role], "manager"],
          singer_status: "active",
          voice: "Soprano"
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

    if (payload.createDefaultProject) {
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
