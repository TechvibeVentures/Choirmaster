import { NextResponse } from "next/server";
import { updateAdminProfileSchema } from "@/lib/apiSchemas";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

export async function PUT(request: Request) {
  try {
    const session = await getCurrentSessionPerson();

    if (!session.person?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = updateAdminProfileSchema.parse(await request.json());
    const db = getServiceSupabaseClient();

    const personRes = await (db as any)
      .from("persons")
      .update({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email.toLowerCase(),
        phone: payload.phone || null,
        city: payload.city || null,
        auth_user_id: session.user?.id || null
      })
      .eq("id", session.person.id)
      .select("id")
      .single();

    if (personRes.error) throw personRes.error;

    const settingsRes = await (db as any)
      .from("person_settings")
      .upsert(
        {
          person_id: session.person.id,
          language: payload.language
        },
        { onConflict: "person_id" }
      )
      .select("person_id")
      .single();

    if (settingsRes.error) throw settingsRes.error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("profile/admin PUT error", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
