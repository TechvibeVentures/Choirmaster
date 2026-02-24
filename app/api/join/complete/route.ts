import { NextResponse } from "next/server";
import { joinCompleteSchema } from "@/lib/apiSchemas";
import { tokenHash } from "@/lib/api/invites/sendInvites";
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
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeSingerStatus = (value: unknown): "active" | "inactive" | "project_only" => {
  if (value === "active" || value === "inactive" || value === "project_only") {
    return value;
  }
  return "project_only";
};

const isPlaceholderToken = (token: string) => /^<[^<>]+>$/.test(token);
const shouldFallbackInviteAccept = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code || "";
  const message = (error as { message?: string }).message || "";
  return (
    code === "42703" ||
    code === "42702" ||
    code === "42804" ||
    code === "42883" ||
    message.includes("has no field") ||
    message.includes("accept_project_invite")
  );
};

export async function POST(request: Request) {
  try {
    const payload = joinCompleteSchema.parse(await request.json());
    const token = normalizeJoinToken(payload.token);
    const email = normalizeEmail(payload.email);

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    if (isPlaceholderToken(token)) {
      return NextResponse.json(
        { error: "Invalid placeholder token" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const db = getServiceSupabaseClient();
    const hash = tokenHash(token);

    const inviteRes = await db
      .from("project_invites")
      .select(
        "id, project_id, choir_id, email, first_name, last_name, voice, roles, singer_status"
      )
      .eq("token_hash", hash)
      .in("status", ["pending", "sent"])
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (inviteRes.error) throw inviteRes.error;

    if (inviteRes.data) {
      if (normalizeEmail(inviteRes.data.email) !== email) {
        return NextResponse.json(
          { error: "Email does not match invitation" },
          { status: 400 }
        );
      }

      const { data: acceptData, error: acceptError } = await db.rpc(
        "accept_project_invite",
        {
          p_token: token,
          p_first_name: payload.first_name || "",
          p_last_name: payload.last_name || "",
          p_voice: payload.voice || null
        }
      );

      if (acceptError) {
        if (!shouldFallbackInviteAccept(acceptError)) {
          console.error("accept_project_invite error", acceptError);
          return NextResponse.json(
            { error: "Failed to accept invite" },
            { status: 400 }
          );
        }

        const personByEmailRes = await (db as any)
          .from("persons")
          .select("id")
          .ilike("email", email)
          .maybeSingle();

        if (personByEmailRes.error) throw personByEmailRes.error;

        const inviteFirstName = (inviteRes.data.first_name || "").trim();
        const inviteLastName = (inviteRes.data.last_name || "").trim();
        const payloadFirstName = (payload.first_name || "").trim();
        const payloadLastName = (payload.last_name || "").trim();
        const normalizedInviteVoice = inviteRes.data.voice
          ? normalizeVoice(inviteRes.data.voice)
          : null;
        const normalizedPayloadVoice = payload.voice ? normalizeVoice(payload.voice) : null;
        const resolvedVoice = normalizedPayloadVoice || normalizedInviteVoice;

        let personId = personByEmailRes.data?.id as string | undefined;

        if (!personId) {
          const insertedRes = await (db as any)
            .from("persons")
            .insert({
              email,
              first_name: payloadFirstName || inviteFirstName,
              last_name: payloadLastName || inviteLastName,
              city: payload.city || "",
              experience_level: "regular",
              tags: [],
              voice: resolvedVoice
            })
            .select("id")
            .single();

          if (insertedRes.error) throw insertedRes.error;
          personId = insertedRes.data.id;
        } else {
          const updated = await (db as any)
            .from("persons")
            .update({
              email,
              first_name: payloadFirstName || inviteFirstName || undefined,
              last_name: payloadLastName || inviteLastName || undefined,
              city: payload.city || undefined,
              ...(resolvedVoice ? { voice: resolvedVoice } : {})
            })
            .eq("id", personId)
            .select("id")
            .single();

          if (updated.error) throw updated.error;
        }

        const inviteRolesRaw = Array.isArray(inviteRes.data.roles)
          ? (inviteRes.data.roles as unknown[])
          : [];
        const inviteRoles = inviteRolesRaw.filter(
          (role): role is string => typeof role === "string" && role.length > 0
        );
        const nextRoles = inviteRoles.length ? inviteRoles : ["singer"];
        const nextSingerStatus = normalizeSingerStatus(inviteRes.data.singer_status);

        const membershipRes = await db
          .from("choir_memberships")
          .upsert(
            {
              choir_id: inviteRes.data.choir_id,
              person_id: personId,
              roles: nextRoles,
              singer_status: nextSingerStatus
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
              project_id: inviteRes.data.project_id,
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
              active_choir_id: inviteRes.data.choir_id
            },
            { onConflict: "person_id" }
          )
          .select("person_id")
          .single();

        if (settingsRes.error) throw settingsRes.error;

        const inviteUpdateRes = await db
          .from("project_invites")
          .update({
            status: "accepted",
            accepted_at: new Date().toISOString()
          })
          .eq("id", inviteRes.data.id)
          .in("status", ["pending", "sent"])
          .select("id")
          .maybeSingle();

        if (inviteUpdateRes.error) throw inviteUpdateRes.error;

        return NextResponse.json({
          personId,
          choirId: inviteRes.data.choir_id,
          projectId: inviteRes.data.project_id,
          inviteStatus: "confirmed"
        });
      }

      const row = Array.isArray(acceptData) ? acceptData[0] : acceptData;
      if (!row) {
        return NextResponse.json(
          { error: "Failed to accept invite" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        personId: row.person_id,
        choirId: row.choir_id,
        projectId: row.project_id,
        inviteStatus: row.invite_status ?? "confirmed"
      });
    }

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

    const personByEmailRes = await (db as any)
      .from("persons")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (personByEmailRes.error) throw personByEmailRes.error;

    let personId = personByEmailRes.data?.id as string | undefined;

    if (!personId) {
      const insertedRes = await (db as any)
        .from("persons")
        .insert({
          email,
          first_name: payload.first_name || "",
          last_name: payload.last_name || "",
          city: payload.city || "",
          experience_level: "regular",
          tags: [],
          voice: payload.voice ? normalizeVoice(payload.voice) : null
        })
        .select("id")
        .single();

      if (insertedRes.error) throw insertedRes.error;
      personId = insertedRes.data.id;
    } else {
      const normalizedVoice = payload.voice ? normalizeVoice(payload.voice) : null;
      const updated = await (db as any)
        .from("persons")
        .update({
          email,
          first_name: payload.first_name || undefined,
          last_name: payload.last_name || undefined,
          city: payload.city || undefined,
          ...(normalizedVoice ? { voice: normalizedVoice } : {})
        })
        .eq("id", personId)
        .select("id")
        .single();

      if (updated.error) throw updated.error;
    }

    const existingMembershipRes = await db
      .from("choir_memberships")
      .select("roles, singer_status")
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

    const membershipRes = await db
      .from("choir_memberships")
      .upsert(
        {
          choir_id: projectRes.data.choir_id,
          person_id: personId,
          roles: nextRoles,
          singer_status: nextSingerStatus
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
