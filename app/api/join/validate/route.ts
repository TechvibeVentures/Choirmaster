import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

const decodeToken = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const normalizeToken = (value: string | null) => decodeToken(value || "").trim();

const isPlaceholderToken = (token: string) => /^<[^<>]+>$/.test(token);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = normalizeToken(searchParams.get("token"));

    if (!token) {
      return NextResponse.json({ valid: false, error: "Missing token" }, { status: 400 });
    }

    if (isPlaceholderToken(token)) {
      return NextResponse.json(
        {
          valid: false,
          error: "Ungültiger Platzhalter. Bitte den echten Einladungstoken verwenden."
        },
        { status: 400 }
      );
    }

    const db = getServiceSupabaseClient();

    const tokenRes = await db
      .from("project_access_tokens")
      .select("project_id, token, active")
      .eq("token", token)
      .eq("active", true)
      .maybeSingle();

    if (tokenRes.error) throw tokenRes.error;
    if (!tokenRes.data) {
      return NextResponse.json({ valid: false });
    }

    const projectRes = await db
      .from("projects")
      .select("id, name, choir_id")
      .eq("id", tokenRes.data.project_id)
      .single();

    if (projectRes.error) throw projectRes.error;

    const choirRes = await db
      .from("choirs")
      .select("id, name, city")
      .eq("id", projectRes.data.choir_id)
      .single();

    if (choirRes.error) throw choirRes.error;

    return NextResponse.json({
      valid: true,
      token,
      project: projectRes.data,
      choir: choirRes.data
    });
  } catch (error) {
    console.error("join/validate error", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate token" },
      { status: 500 }
    );
  }
}
