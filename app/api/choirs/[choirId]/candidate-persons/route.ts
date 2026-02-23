import { NextResponse } from "next/server";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { normalizeExperience } from "@/lib/data/common";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

const normalizeOptionalVoice = (value: string | null) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "soprano" || normalized === "sopran") return "Soprano" as const;
  if (normalized === "alto" || normalized === "alt") return "Alto" as const;
  if (normalized === "tenor") return "Tenor" as const;
  if (normalized === "bass" || normalized === "basso") return "Bass" as const;
  return null;
};

type PersonRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  experience_level: string | null;
};

type MembershipRow = {
  person_id: string;
  choir_id: string;
  voice: string | null;
};

export async function GET(
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

    const personsRes = await serviceDb
      .from("persons")
      .select("id, email, first_name, last_name, city, experience_level");

    if (personsRes.error) throw personsRes.error;

    const persons = (personsRes.data || []) as PersonRow[];
    if (!persons.length) {
      return NextResponse.json({ persons: [] });
    }

    const personIds = persons.map((person) => person.id);
    const membershipsRes = await serviceDb
      .from("choir_memberships")
      .select("person_id, choir_id, voice")
      .in("person_id", personIds);

    if (membershipsRes.error) throw membershipsRes.error;

    const memberships = (membershipsRes.data || []) as MembershipRow[];
    const inCurrentChoir = new Set(
      memberships
        .filter((membership) => membership.choir_id === params.choirId)
        .map((membership) => membership.person_id)
    );

    const voiceByPersonId = new Map<string, "Soprano" | "Alto" | "Tenor" | "Bass" | null>();
    memberships.forEach((membership) => {
      if (membership.choir_id === params.choirId) return;
      if (voiceByPersonId.has(membership.person_id)) return;
      voiceByPersonId.set(
        membership.person_id,
        normalizeOptionalVoice(membership.voice)
      );
    });

    const candidates = persons
      .filter((person) => !inCurrentChoir.has(person.id))
      .map((person) => ({
        id: person.id,
        name: `${person.first_name || ""} ${person.last_name || ""}`.trim() || person.email,
        email: person.email,
        city: person.city || "",
        experience: normalizeExperience(person.experience_level),
        voice: voiceByPersonId.get(person.id) ?? null
      }));

    return NextResponse.json({ persons: candidates });
  } catch (error) {
    console.error("choirs/[choirId]/candidate-persons error", error);
    return NextResponse.json(
      { error: "Failed to load candidate persons" },
      { status: 500 }
    );
  }
}

