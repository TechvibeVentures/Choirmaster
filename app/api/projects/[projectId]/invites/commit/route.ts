import { NextResponse } from "next/server";
import { commitInvitesSchema } from "@/lib/apiSchemas";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { normalizeVoice } from "@/lib/data/common";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

const splitName = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned) return { first: "", last: "" };
  const [first, ...rest] = cleaned.split(/\s+/);
  return { first, last: rest.join(" ") };
};

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getCurrentSessionPerson();
    if (!session.person?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = commitInvitesSchema.parse(await request.json());

    const serverDb = getServerSupabaseClient();
    const serviceDb = getServiceSupabaseClient();

    const projectRes = await serviceDb
      .from("projects")
      .select("id, choir_id")
      .eq("id", params.projectId)
      .single();

    if (projectRes.error || !projectRes.data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const adminCheck = await serverDb.rpc("is_admin", {
      choir: projectRes.data.choir_id
    });

    if (adminCheck.error) throw adminCheck.error;

    if (!adminCheck.data) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let createdPersons = 0;
    let upsertedMemberships = 0;
    let upsertedParticipants = 0;

    for (const invite of payload.invites) {
      const personByEmail = await serviceDb
        .from("persons")
        .select("id, first_name, last_name")
        .eq("email", invite.email)
        .maybeSingle();

      if (personByEmail.error) throw personByEmail.error;

      let personId = personByEmail.data?.id;

      if (!personId) {
        const derived = splitName(invite.name || "");
        const normalizedVoice = invite.voice ? normalizeVoice(invite.voice) : null;
        const inserted = await serviceDb
          .from("persons")
          .insert({
            email: invite.email,
            first_name: invite.first_name || derived.first || "",
            last_name: invite.last_name || derived.last || "",
            city: "",
            experience_level: "regular",
            tags: [],
            voice: normalizedVoice
          })
          .select("id")
          .single();

        if (inserted.error) throw inserted.error;
        personId = inserted.data.id;
        createdPersons += 1;
      } else if (invite.voice) {
        const personVoiceUpdate = await serviceDb
          .from("persons")
          .update({ voice: normalizeVoice(invite.voice) })
          .eq("id", personId)
          .select("id")
          .single();

        if (personVoiceUpdate.error) throw personVoiceUpdate.error;
      }

      const membership = await serviceDb
        .from("choir_memberships")
        .upsert(
          {
            choir_id: projectRes.data.choir_id,
            person_id: personId,
            roles: Array.from(new Set(["singer", ...(invite.roles || [])])),
            singer_status: invite.singer_status || "project_only"
          },
          { onConflict: "choir_id,person_id" }
        )
        .select("id")
        .single();

      if (membership.error) throw membership.error;
      upsertedMemberships += 1;

      const participant = await serviceDb
        .from("project_participants")
        .upsert(
          {
            project_id: params.projectId,
            person_id: personId,
            invite_status: "invited"
          },
          { onConflict: "project_id,person_id" }
        )
        .select("id")
        .single();

      if (participant.error) throw participant.error;
      upsertedParticipants += 1;
    }

    return NextResponse.json({
      createdPersons,
      upsertedMemberships,
      upsertedParticipants
    });
  } catch (error) {
    console.error("projects/[projectId]/invites/commit error", error);
    return NextResponse.json(
      { error: "Failed to commit invites" },
      { status: 500 }
    );
  }
}
