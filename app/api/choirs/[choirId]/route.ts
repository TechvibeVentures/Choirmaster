import { NextResponse } from "next/server";
import { updateChoirVoiceDistributionSchema } from "@/lib/apiSchemas";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { VOICE_ORDER, normalizeVoiceDistribution } from "@/lib/domain/voiceDistribution";
import type { Voice } from "@/lib/domain/types";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const normalizeOptionalVoice = (value: string | null | undefined): Voice | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "soprano" || normalized === "sopran") return "Soprano";
  if (normalized === "alto" || normalized === "alt") return "Alto";
  if (normalized === "tenor") return "Tenor";
  if (normalized === "bass" || normalized === "basso") return "Bass";
  return null;
};

const isSingerMembership = (
  roles: string[] | null | undefined,
  singerStatus: string | null | undefined
) => {
  if (singerStatus === "inactive") return false;
  if (!roles || roles.length === 0) return true;
  return roles.includes("singer");
};

export async function PATCH(
  request: Request,
  { params }: { params: { choirId: string } }
) {
  try {
    const session = await getCurrentSessionPerson();
    if (!session.person?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateChoirVoiceDistributionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const nextDistribution = normalizeVoiceDistribution(
      parsed.data.voice_distribution
    );

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
      .select("person_id, roles, singer_status")
      .eq("choir_id", params.choirId);

    if (membershipsRes.error) throw membershipsRes.error;

    const singerMemberships = (membershipsRes.data || []).filter((row: any) =>
      isSingerMembership(row.roles, row.singer_status)
    );
    const singerPersonIds = Array.from(
      new Set(singerMemberships.map((row: any) => row.person_id))
    ) as string[];

    const singerCountsByVoice = new Map<Voice, number>();
    VOICE_ORDER.forEach((voice) => singerCountsByVoice.set(voice, 0));

    if (singerPersonIds.length > 0) {
      const personsRes = await serviceDb
        .from("persons")
        .select("id, voice")
        .in("id", singerPersonIds);

      if (personsRes.error) throw personsRes.error;

      (personsRes.data || []).forEach((row: any) => {
        const voice = normalizeOptionalVoice(row.voice);
        if (!voice) return;
        singerCountsByVoice.set(voice, (singerCountsByVoice.get(voice) ?? 0) + 1);
      });
    }

    for (const voice of VOICE_ORDER) {
      const currentCount = singerCountsByVoice.get(voice) ?? 0;
      const requestedCount = nextDistribution[voice].reduce(
        (sum, slot) => sum + slot,
        0
      );
      if (requestedCount < currentCount) {
        return NextResponse.json(
          {
            error: "voice_distribution_below_current_singers",
            voice,
            current: currentCount,
            requested: requestedCount
          },
          { status: 409 }
        );
      }
    }

    const updateRes = await serviceDb
      .from("choirs")
      .update({
        voice_distribution: nextDistribution
      })
      .eq("id", params.choirId)
      .select("id, voice_distribution")
      .maybeSingle();

    if (updateRes.error) throw updateRes.error;
    if (!updateRes.data?.id) {
      return NextResponse.json({ error: "Choir not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      choir: {
        id: updateRes.data.id,
        voice_distribution: normalizeVoiceDistribution(
          updateRes.data.voice_distribution
        )
      }
    });
  } catch (error) {
    console.error("choirs/[choirId] patch error", error);
    return NextResponse.json(
      { error: "Failed to update choir voice distribution" },
      { status: 500 }
    );
  }
}

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
