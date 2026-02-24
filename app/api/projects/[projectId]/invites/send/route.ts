import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { commitInvitesSchema } from "@/lib/apiSchemas";
import { createAndSendInvites } from "@/lib/api/invites/sendInvites";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

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

    const result = await createAndSendInvites(
      serviceDb,
      {
        projectId: params.projectId,
        choirId: projectRes.data.choir_id,
        projectName: projectRes.data.name ?? "",
        choirName,
        createdByPersonId: session.person.id
      },
      payload.invites
    );

    if (result.invitesToSend.length === 0 && result.skipped === payload.invites.length) {
      return NextResponse.json({
        sent: 0,
        created: 0,
        skipped: payload.invites.length,
        error: "No invites created (all may already exist)"
      }, { status: 409 });
    }

    return NextResponse.json({
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
    console.error("projects/[projectId]/invites/send error", error);
    return NextResponse.json(
      { error: "Failed to send invites" },
      { status: 500 }
    );
  }
}
