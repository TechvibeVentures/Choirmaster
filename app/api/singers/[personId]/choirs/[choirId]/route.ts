import { NextResponse } from "next/server";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(
  _request: Request,
  { params }: { params: { personId: string; choirId: string } }
) {
  try {
    const session = await getCurrentSessionPerson();
    if (!session.person?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serverDb = getServerSupabaseClient();
    const serviceDb = getServiceSupabaseClient();

    const adminCheck = await serverDb.rpc("is_admin", {
      choir: params.choirId
    });

    if (adminCheck.error) throw adminCheck.error;
    if (!adminCheck.data) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const membershipRes = await serviceDb
      .from("choir_memberships")
      .select("id")
      .eq("choir_id", params.choirId)
      .eq("person_id", params.personId)
      .maybeSingle();

    if (membershipRes.error) throw membershipRes.error;
    if (!membershipRes.data) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    const projectsRes = await serviceDb
      .from("projects")
      .select("id")
      .eq("choir_id", params.choirId);

    if (projectsRes.error) throw projectsRes.error;
    const projectIds = (projectsRes.data || []).map((row: { id: string }) => row.id);

    let removedParticipants = 0;
    let removedAvailability = 0;

    if (projectIds.length > 0) {
      const rehearsalsRes = await serviceDb
        .from("rehearsals")
        .select("id")
        .in("project_id", projectIds);

      if (rehearsalsRes.error) throw rehearsalsRes.error;
      const rehearsalIds = (rehearsalsRes.data || []).map((row: { id: string }) => row.id);

      if (rehearsalIds.length > 0) {
        const availabilityRes = await serviceDb
          .from("availability")
          .delete()
          .eq("person_id", params.personId)
          .in("rehearsal_id", rehearsalIds)
          .select("id");

        if (availabilityRes.error) throw availabilityRes.error;
        removedAvailability = (availabilityRes.data || []).length;
      }

      const participantsRes = await serviceDb
        .from("project_participants")
        .delete()
        .eq("person_id", params.personId)
        .in("project_id", projectIds)
        .select("id");

      if (participantsRes.error) throw participantsRes.error;
      removedParticipants = (participantsRes.data || []).length;
    }

    const membershipDeleteRes = await serviceDb
      .from("choir_memberships")
      .delete()
      .eq("id", membershipRes.data.id)
      .select("id")
      .maybeSingle();

    if (membershipDeleteRes.error) throw membershipDeleteRes.error;
    if (!membershipDeleteRes.data?.id) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    const settingsRes = await (serviceDb as any)
      .from("person_settings")
      .update({ active_choir_id: null })
      .eq("person_id", params.personId)
      .eq("active_choir_id", params.choirId);

    if (settingsRes.error) throw settingsRes.error;

    return NextResponse.json({
      ok: true,
      removedMembershipId: membershipDeleteRes.data.id,
      removedProjectIds: projectIds,
      removedParticipants,
      removedAvailability
    });
  } catch (error) {
    console.error("singers/[personId]/choirs/[choirId] DELETE error", error);
    return NextResponse.json(
      { error: "Failed to remove singer from choir and projects" },
      { status: 500 }
    );
  }
}
