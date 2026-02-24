import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeEmail } from "@/lib/auth/userAccess";
import { tokenHash } from "@/lib/api/invites/sendInvites";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

const preflightSchema = z.object({
  email: z.string().email(),
  flow: z.enum(["login", "signup"]),
  next: z.string().optional().default("")
});

const SINGER_ROLE = "singer";

type PreflightReason =
  | "allowed"
  | "not_invited"
  | "singer_only"
  | "invalid_invite_token";

const jsonResponse = (allowed: boolean, reason: PreflightReason, status = 200) =>
  NextResponse.json({ allowed, reason }, { status });

const decodePart = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getJoinTokenFromNextPath = (nextPath: string) => {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) return "";

  try {
    const parsed = new URL(nextPath, "http://localhost");
    return decodePart(parsed.searchParams.get("join_token") || "").trim();
  } catch {
    return "";
  }
};

const hasPendingInviteWithToken = async (email: string, token: string) => {
  if (!email || !token) return false;
  const db = getServiceSupabaseClient();
  const inviteRes = await db
    .from("project_invites")
    .select("id")
    .eq("token_hash", tokenHash(token))
    .eq("email", email)
    .in("status", ["pending", "sent"])
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (inviteRes.error) throw inviteRes.error;
  return Boolean(inviteRes.data?.id);
};

const hasExistingPerson = async (email: string) => {
  const db = getServiceSupabaseClient();
  const personRes = await db
    .from("persons")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (personRes.error) throw personRes.error;
  return personRes.data?.id || "";
};

const isSingerOnlyPerson = async (personId: string) => {
  if (!personId) return false;

  const db = getServiceSupabaseClient();
  const membershipsRes = await db
    .from("choir_memberships")
    .select("roles")
    .eq("person_id", personId);

  if (membershipsRes.error) throw membershipsRes.error;

  const memberships = membershipsRes.data || [];
  if (!memberships.length) return false;

  let hasSinger = false;
  let hasAdmin = false;
  for (const membership of memberships) {
    const rolesRaw = Array.isArray(membership.roles)
      ? (membership.roles as unknown[])
      : [];
    const roles = rolesRaw.filter(
      (role): role is string => typeof role === "string"
    );
    if (roles.includes(SINGER_ROLE)) hasSinger = true;
    if (roles.some((role) => role === "chairman" || role === "conductor" || role === "manager")) {
      hasAdmin = true;
    }
  }

  return hasSinger && !hasAdmin;
};

export async function POST(request: Request) {
  try {
    const payload = preflightSchema.parse(await request.json());
    const email = normalizeEmail(payload.email);
    const personId = await hasExistingPerson(email);

    if (payload.flow === "login") {
      if (personId) {
        return jsonResponse(true, "allowed");
      }

      const joinToken = getJoinTokenFromNextPath(payload.next || "");
      if (!joinToken) {
        return jsonResponse(false, "not_invited", 403);
      }

      const hasInvite = await hasPendingInviteWithToken(email, joinToken);
      if (!hasInvite) {
        return jsonResponse(false, "invalid_invite_token", 403);
      }

      return jsonResponse(true, "allowed");
    }

    const singerOnly = await isSingerOnlyPerson(personId);
    if (singerOnly) {
      return jsonResponse(false, "singer_only", 403);
    }

    return jsonResponse(true, "allowed");
  } catch (error) {
    console.error("auth/preflight error", error);
    return NextResponse.json(
      { allowed: false, reason: "internal_error" },
      { status: 500 }
    );
  }
}
