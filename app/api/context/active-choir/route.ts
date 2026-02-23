import { NextResponse } from "next/server";
import { setActiveChoirSchema } from "@/lib/apiSchemas";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSessionPerson();
    if (!session.person?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServerSupabaseClient();
    const anyDb = supabase as any;

    const [settingsRes, membershipsRes] = await Promise.all([
      anyDb
        .from("person_settings")
        .select("active_choir_id")
        .eq("person_id", session.person.id)
        .maybeSingle(),
      supabase
        .from("choir_memberships")
        .select("choir_id")
        .eq("person_id", session.person.id)
    ]);

    if (settingsRes.error && settingsRes.error.code !== "42P01") {
      throw settingsRes.error;
    }
    if (membershipsRes.error) {
      throw membershipsRes.error;
    }

    const availableChoirs = Array.from(
      new Set((membershipsRes.data || []).map((item: any) => item.choir_id))
    );

    const activeChoirId =
      settingsRes.data?.active_choir_id || availableChoirs[0] || "";

    return NextResponse.json({
      activeChoirId,
      availableChoirs
    });
  } catch (error) {
    console.error("context/active-choir GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch active choir" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getCurrentSessionPerson();
    if (!session.person?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = setActiveChoirSchema.parse(await request.json());

    const supabase = getServerSupabaseClient();
    const anyDb = supabase as any;

    const membershipCheck = await supabase
      .from("choir_memberships")
      .select("choir_id")
      .eq("person_id", session.person.id)
      .eq("choir_id", payload.choirId)
      .maybeSingle();

    if (membershipCheck.error) throw membershipCheck.error;
    if (!membershipCheck.data) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateRes = await anyDb
      .from("person_settings")
      .upsert(
        {
          person_id: session.person.id,
          active_choir_id: payload.choirId
        },
        { onConflict: "person_id" }
      )
      .select("active_choir_id")
      .single();

    if (updateRes.error) throw updateRes.error;

    return NextResponse.json({ ok: true, activeChoirId: updateRes.data.active_choir_id });
  } catch (error) {
    console.error("context/active-choir PUT error", error);
    return NextResponse.json(
      { error: "Failed to update active choir" },
      { status: 500 }
    );
  }
}
