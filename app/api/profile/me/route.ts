import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { updateMeProfileSchema } from "@/lib/apiSchemas";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

export async function PUT(request: Request) {
  try {
    const session = await getCurrentSessionPerson();

    if (!session.user || !session.person?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = updateMeProfileSchema.parse(await request.json());
    const nextEmail = payload.email.trim().toLowerCase();

    const serverDb = getServerSupabaseClient();
    const serviceDb = getServiceSupabaseClient();

    const membershipRes = await serverDb
      .from("choir_memberships")
      .select("id")
      .eq("person_id", session.person.id)
      .eq("choir_id", payload.choir_id)
      .maybeSingle();

    if (membershipRes.error) throw membershipRes.error;
    if (!membershipRes.data) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentEmail = (session.user.email || session.person.email || "").toLowerCase();
    let emailChangeRequested = false;

    const authMetadata = (session.user.user_metadata || {}) as Record<string, unknown>;
    const authUpdatePayload: {
      email?: string;
      data: Record<string, unknown>;
    } = {
      data: {
        ...authMetadata,
        first_name: payload.first_name,
        last_name: payload.last_name
      }
    };

    if (nextEmail !== currentEmail) {
      authUpdatePayload.email = nextEmail;
      emailChangeRequested = true;
    }

    const { error: authUpdateError } = await serverDb.auth.updateUser(authUpdatePayload);

    if (authUpdateError) {
      const baseError =
        nextEmail !== currentEmail
          ? `Failed to request email change: ${authUpdateError.message}`
          : `Failed to sync auth profile: ${authUpdateError.message}`;
      return NextResponse.json(
        { error: baseError },
        { status: 400 }
      );
    }

    const personRes = await (serviceDb as any)
      .from("persons")
      .update({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: nextEmail,
        phone: payload.phone || null,
        city: payload.city || null,
        experience_level: payload.experience_level,
        auth_user_id: session.user.id
      })
      .eq("id", session.person.id)
      .select("id")
      .single();

    if (personRes.error) {
      if (emailChangeRequested) {
        return NextResponse.json(
          {
            error:
              "Email change requested, but profile sync failed. Please retry to align profile data."
          },
          { status: 500 }
        );
      }
      throw personRes.error;
    }

    const voiceRes = await serviceDb
      .from("choir_memberships")
      .update({
        voice: payload.voice
      })
      .eq("person_id", session.person.id)
      .eq("choir_id", payload.choir_id)
      .select("id")
      .maybeSingle();

    if (voiceRes.error) throw voiceRes.error;
    if (!voiceRes.data) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      emailChangeRequested,
      profile: {
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: nextEmail,
        phone: payload.phone,
        city: payload.city,
        experience_level: payload.experience_level,
        voice: payload.voice,
        choir_id: payload.choir_id
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", details: error.issues },
        { status: 400 }
      );
    }
    console.error("profile/me PUT error", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
