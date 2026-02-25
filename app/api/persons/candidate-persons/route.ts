import { NextResponse } from "next/server";
import { normalizeExperience } from "@/lib/data/common";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

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
  voice: string | null;
};

export async function GET() {
  try {
    const session = await getCurrentSessionPerson();
    if (!session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceDb = getServiceSupabaseClient();
    const personsRes = await serviceDb
      .from("persons")
      .select("id, email, first_name, last_name, city, experience_level, voice");

    if (personsRes.error) throw personsRes.error;

    const persons = (personsRes.data || []) as PersonRow[];
    const mappedCandidates = persons.map((person) => ({
      id: person.id,
      name: `${person.first_name || ""} ${person.last_name || ""}`.trim() || person.email,
      email: person.email,
      city: person.city || "",
      experience: normalizeExperience(person.experience_level),
      voice: normalizeOptionalVoice(person.voice)
    }));

    return NextResponse.json({ persons: mappedCandidates });
  } catch (error) {
    console.error("persons/candidate-persons error", error);
    return NextResponse.json(
      { error: "Failed to load candidate persons" },
      { status: 500 }
    );
  }
}
