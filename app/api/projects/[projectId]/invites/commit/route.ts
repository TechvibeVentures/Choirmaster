import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { commitInvitesSchema } from "@/lib/apiSchemas";
import { createAndSendInvites } from "@/lib/api/invites/sendInvites";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizeSingerStatus = (value: unknown): "active" | "inactive" | "project_only" => {
  if (value === "active" || value === "inactive" || value === "project_only") {
    return value;
  }
  return "project_only";
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
      .select("id, choir_id, name")
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

    const choirRes = await serviceDb
      .from("choirs")
      .select("name")
      .eq("id", projectRes.data.choir_id)
      .single();

    const choirName = choirRes.data?.name ?? "";

    const invites = payload.invites.map((invite) => ({
      ...invite,
      email: normalizeEmail(invite.email)
    }));

    const personIdsFromPayload = Array.from(
      new Set(
        invites
          .map((invite) => invite.person_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      )
    );

    const inviteEmails = Array.from(
      new Set(invites.map((invite) => invite.email).filter((value) => value.length > 0))
    );

    const personsById = new Map<string, { id: string; email: string }>();
    const personsByEmail = new Map<string, { id: string; email: string }>();

    if (personIdsFromPayload.length > 0) {
      const byIdRes = await serviceDb
        .from("persons")
        .select("id, email")
        .in("id", personIdsFromPayload);
      if (byIdRes.error) throw byIdRes.error;
      for (const row of byIdRes.data || []) {
        const normalized = normalizeEmail(row.email || "");
        const mapped = { id: row.id, email: normalized };
        personsById.set(row.id, mapped);
        if (normalized) personsByEmail.set(normalized, mapped);
      }
    }

    if (inviteEmails.length > 0) {
      const byEmailRes = await serviceDb
        .from("persons")
        .select("id, email")
        .in("email", inviteEmails);
      if (byEmailRes.error) throw byEmailRes.error;
      for (const row of byEmailRes.data || []) {
        const normalized = normalizeEmail(row.email || "");
        const mapped = { id: row.id, email: normalized };
        personsById.set(row.id, mapped);
        if (normalized) personsByEmail.set(normalized, mapped);
      }
    }

    const invitesForEmail = [] as typeof invites;
    let attached = 0;

    for (const invite of invites) {
      const personById = invite.person_id ? personsById.get(invite.person_id) : undefined;
      const personByEmail = personsByEmail.get(invite.email);
      const person = personById || personByEmail;

      if (!person) {
        invitesForEmail.push(invite);
        continue;
      }

      const inviteRoles = Array.isArray(invite.roles)
        ? invite.roles.filter((role): role is string => typeof role === "string" && role.length > 0)
        : [];
      const roles = inviteRoles.length ? Array.from(new Set([...inviteRoles, "singer"])) : ["singer"];

      const membershipRes = await serviceDb
        .from("choir_memberships")
        .upsert(
          {
            choir_id: projectRes.data.choir_id,
            person_id: person.id,
            roles,
            singer_status: normalizeSingerStatus(invite.singer_status)
          },
          { onConflict: "choir_id,person_id" }
        )
        .select("id")
        .single();
      if (membershipRes.error) throw membershipRes.error;

      const participantRes = await serviceDb
        .from("project_participants")
        .upsert(
          {
            project_id: params.projectId,
            person_id: person.id,
            invite_status: "confirmed"
          },
          { onConflict: "project_id,person_id" }
        )
        .select("id")
        .single();
      if (participantRes.error) throw participantRes.error;

      attached += 1;
    }

    let result = {
      sent: 0,
      created: 0,
      skipped: invitesForEmail.length,
      invitesToSend: [] as Array<{
        email: string;
        token: string;
        first_name: string;
        last_name: string;
        project_name: string;
        choir_name: string;
      }>
    };

    if (invitesForEmail.length > 0) {
      result = await createAndSendInvites(
        serviceDb,
        {
          projectId: params.projectId,
          choirId: projectRes.data.choir_id,
          projectName: projectRes.data.name ?? "",
          choirName,
          createdByPersonId: session.person.id
        },
        invitesForEmail
      );
    }

    if (result.invitesToSend.length === 0 && attached === 0 && result.skipped === invites.length) {
      return NextResponse.json({
        sent: 0,
        created: 0,
        attached: 0,
        skipped: invites.length,
        error: "No singers were added or invited"
      }, { status: 409 });
    }

    return NextResponse.json({
      attached,
      sent: result.sent,
      created: result.created,
      skipped: result.skipped
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const invalidInviteRows = error.issues
        .filter((issue) => issue.path?.[0] === "invites" && issue.path?.[2] === "email")
        .map((issue) => Number(issue.path?.[1]))
        .filter((index) => Number.isFinite(index));

      return NextResponse.json(
        {
          error: "Invalid payload",
          details: error.issues,
          invalidInviteRows
        },
        { status: 400 }
      );
    }
    console.error("projects/[projectId]/invites/commit error", error);
    return NextResponse.json(
      { error: "Failed to send invites" },
      { status: 500 }
    );
  }
}
