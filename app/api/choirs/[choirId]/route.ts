import { NextResponse } from "next/server";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(
  _request: Request,
  { params }: { params: { choirId: string } }
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

    const membershipsRes = await serviceDb
      .from("choir_memberships")
      .select("choir_id")
      .eq("person_id", session.person.id);

    if (membershipsRes.error) throw membershipsRes.error;
    const choirIds = Array.from(
      new Set((membershipsRes.data || []).map((row: { choir_id: string }) => row.choir_id))
    );
    if (choirIds.length <= 1 && choirIds.includes(params.choirId)) {
      return NextResponse.json(
        { error: "At least one choir must remain" },
        { status: 400 }
      );
    }

    const deleteRes = await serviceDb
      .from("choirs")
      .delete()
      .eq("id", params.choirId)
      .select("id")
      .maybeSingle();

    if (deleteRes.error) throw deleteRes.error;
    if (!deleteRes.data?.id) {
      return NextResponse.json({ error: "Choir not found" }, { status: 404 });
    }

    const remainingMembershipsRes = await serviceDb
      .from("choir_memberships")
      .select("choir_id")
      .eq("person_id", session.person.id)
      .limit(1);

    if (remainingMembershipsRes.error) throw remainingMembershipsRes.error;
    const nextActiveChoirId = remainingMembershipsRes.data?.[0]?.choir_id ?? null;

    const anyDb = serviceDb as any;
    const settingsRes = await anyDb
      .from("person_settings")
      .upsert(
        {
          person_id: session.person.id,
          active_choir_id: nextActiveChoirId
        },
        { onConflict: "person_id" }
      )
      .select("person_id")
      .single();

    if (settingsRes.error) throw settingsRes.error;

    return NextResponse.json({ ok: true, nextActiveChoirId });
  } catch (error) {
    console.error("choirs/[choirId] delete error", error);
    return NextResponse.json(
      { error: "Failed to delete choir" },
      { status: 500 }
    );
  }
}
