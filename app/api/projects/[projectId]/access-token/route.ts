import { NextResponse } from "next/server";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getCurrentSessionPerson();
    if (!session.person?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serverDb = getServerSupabaseClient();
    const serviceDb = getServiceSupabaseClient();

    const projectAccess = await serviceDb
      .from("projects")
      .select("id, choir_id")
      .eq("id", params.projectId)
      .maybeSingle();

    if (projectAccess.error) throw projectAccess.error;
    if (!projectAccess.data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const adminCheck = await serverDb.rpc("is_admin", {
      choir: projectAccess.data.choir_id
    });

    if (adminCheck.error) throw adminCheck.error;
    if (!adminCheck.data) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let tokenRes = await serviceDb
      .from("project_access_tokens")
      .select("token")
      .eq("project_id", params.projectId)
      .eq("active", true)
      .maybeSingle();

    if (tokenRes.error) throw tokenRes.error;

    if (!tokenRes.data) {
      tokenRes = await serviceDb
        .from("project_access_tokens")
        .insert({
          project_id: params.projectId,
          active: true
        })
        .select("token")
        .single();

      if (tokenRes.error) throw tokenRes.error;
    }

    return NextResponse.json({
      token: tokenRes.data.token
    });
  } catch (error) {
    console.error("projects/[projectId]/access-token error", error);
    return NextResponse.json(
      { error: "Failed to get project access token" },
      { status: 500 }
    );
  }
}
