import { NextResponse } from "next/server";
import { joinCompleteSchema } from "@/lib/apiSchemas";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { normalizeVoice } from "@/lib/data/common";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

const decodeToken = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const normalizeJoinToken = (token: string) => decodeToken(token).trim();

const isPlaceholderToken = (token: string) => /^<[^<>]+>$/.test(token);

export async function POST(request: Request) {
  try {
    const payload = joinCompleteSchema.parse(await request.json());
    const token = normalizeJoinToken(payload.token);

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    if (isPlaceholderToken(token)) {
      return NextResponse.json(
        { error: "Invalid placeholder token" },
        { status: 400 }
      );
    }

    const session = await getCurrentSessionPerson();
    if (!session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getServiceSupabaseClient();

    const tokenRes = await db
      .from("project_access_tokens")
      .select("project_id, token, active")
      .eq("token", token)
      .eq("active", true)
      .single();

    if (tokenRes.error || !tokenRes.data) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    const projectRes = await db
      .from("projects")
      .select("id, choir_id")
      .eq("id", tokenRes.data.project_id)
      .single();

    if (projectRes.error || !projectRes.data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let personId = session.person?.id;

    if (!personId) {
      const inserted = await (db as any)
        .from("persons")
        .insert({
          email: session.user.email,
          first_name: payload.first_name || "",
          last_name: payload.last_name || "",
          city: payload.city || "",
          auth_user_id: session.user.id,
          experience_level: "regular",
          tags: []
        })
        .select("id")
        .single();

      if (inserted.error) throw inserted.error;
      personId = inserted.data.id;
    } else {
      const updated = await (db as any)
        .from("persons")
        .update({
          auth_user_id: session.user.id,
          first_name: payload.first_name || undefined,
          last_name: payload.last_name || undefined,
          city: payload.city || undefined
        })
        .eq("id", personId)
        .select("id")
        .single();

      if (updated.error) throw updated.error;
    }

    const existingMembershipRes = await db
      .from("choir_memberships")
      .select("roles, singer_status, voice")
      .eq("choir_id", projectRes.data.choir_id)
      .eq("person_id", personId)
      .maybeSingle();

    if (existingMembershipRes.error) throw existingMembershipRes.error;

    const existingRolesRaw = Array.isArray(existingMembershipRes.data?.roles)
      ? (existingMembershipRes.data.roles as unknown[])
      : [];
    const existingRoles = existingRolesRaw.filter(
      (role): role is string => typeof role === "string" && role.length > 0
    );
    const nextRoles = existingRoles.length
      ? Array.from(new Set([...existingRoles, "singer"]))
      : ["singer"];
    const nextSingerStatus =
      existingMembershipRes.data?.singer_status ?? "project_only";
    const nextVoice = payload.voice
      ? normalizeVoice(payload.voice)
      : existingMembershipRes.data?.voice ?? null;

    const membershipRes = await db
      .from("choir_memberships")
      .upsert(
        {
          choir_id: projectRes.data.choir_id,
          person_id: personId,
          roles: nextRoles,
          singer_status: nextSingerStatus,
          voice: nextVoice
        },
        { onConflict: "choir_id,person_id" }
      )
      .select("id")
      .single();

    if (membershipRes.error) throw membershipRes.error;

    const participantRes = await db
      .from("project_participants")
      .upsert(
        {
          project_id: projectRes.data.id,
          person_id: personId,
          invite_status: "confirmed"
        },
        { onConflict: "project_id,person_id" }
      )
      .select("id")
      .single();

    if (participantRes.error) throw participantRes.error;

    const settingsRes = await (db as any)
      .from("person_settings")
      .upsert(
        {
          person_id: personId,
          active_choir_id: projectRes.data.choir_id
        },
        { onConflict: "person_id" }
      )
      .select("person_id")
      .single();

    if (settingsRes.error) throw settingsRes.error;

    return NextResponse.json({
      personId,
      choirId: projectRes.data.choir_id,
      projectId: projectRes.data.id,
      inviteStatus: "confirmed"
    });
  } catch (error) {
    console.error("join/complete error", error);
    return NextResponse.json(
      { error: "Failed to complete join" },
      { status: 500 }
    );
  }
}
