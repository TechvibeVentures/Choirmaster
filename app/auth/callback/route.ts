import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";
import {
  classifyUserKindFromMemberships,
  normalizeEmail,
  type UserKind
} from "@/lib/auth/userAccess";
import { tokenHash as hashInviteToken } from "@/lib/api/invites/sendInvites";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

const getSafeNextPath = (value: string | null) => {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
};

const isEmailOtpType = (value: string | null): value is EmailOtpType => {
  if (!value) return false;
  return [
    "signup",
    "invite",
    "magiclink",
    "recovery",
    "email_change",
    "email"
  ].includes(value);
};

const toTrimmed = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const getFirstHeaderValue = (value: string | null) => {
  if (!value) return "";
  return value.split(",")[0]?.trim() ?? "";
};

const getRequestOrigin = (request: NextRequest, requestUrl: URL) => {
  const host =
    getFirstHeaderValue(request.headers.get("x-forwarded-host")) ||
    getFirstHeaderValue(request.headers.get("host"));

  if (!host) return requestUrl.origin;

  const protocol =
    getFirstHeaderValue(request.headers.get("x-forwarded-proto")) ||
    requestUrl.protocol.replace(":", "") ||
    "http";

  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return requestUrl.origin;
  }
};

const decodePart = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

type CapacityErrorDetails =
  | { type: "voice_missing_for_capacity" }
  | { type: "voice_capacity_exceeded"; voice: string; current: number; limit: number };

const parseCapacityError = (message: string): CapacityErrorDetails | null => {
  if (message.includes("voice_missing_for_capacity")) {
    return { type: "voice_missing_for_capacity" };
  }
  if (!message.includes("voice_capacity_exceeded|")) return null;
  const [, voice = "", current = "0", limit = "0"] = message.split("|");
  return {
    type: "voice_capacity_exceeded",
    voice,
    current: Number(current),
    limit: Number(limit)
  };
};

const getJoinTokenFromNextPath = (next: string, origin: string) => {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "";
  try {
    const parsed = new URL(next, origin);
    return decodePart(parsed.searchParams.get("join_token") || "").trim();
  } catch {
    return "";
  }
};

const hasPendingInviteWithToken = async (email: string, joinToken: string) => {
  if (!email || !joinToken) return false;
  const service = getServiceSupabaseClient();

  const inviteRes = await service
    .from("project_invites")
    .select("id")
    .eq("token_hash", hashInviteToken(joinToken))
    .eq("email", email)
    .in("status", ["pending", "sent"])
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (inviteRes.error) throw inviteRes.error;
  return Boolean(inviteRes.data?.id);
};

const finalizePendingInvite = async (email: string, joinToken: string) => {
  if (!email || !joinToken) return;

  const service = getServiceSupabaseClient();
  const inviteRes = await service
    .from("project_invites")
    .select("id, email")
    .eq("token_hash", hashInviteToken(joinToken))
    .in("status", ["pending", "sent"])
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (inviteRes.error) throw inviteRes.error;
  if (!inviteRes.data?.id) return;

  if (normalizeEmail(inviteRes.data.email) !== email) {
    throw new Error("invite_email_mismatch");
  }

  const { error: acceptError } = await service.rpc("accept_project_invite", {
    p_token: joinToken,
    p_first_name: "",
    p_last_name: "",
    p_voice: null
  });

  if (acceptError) throw acceptError;
};

const syncPersonFromAuth = async (user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) => {
  const email = (user.email || "").trim().toLowerCase();
  if (!email) return;

  const metadata = (user.user_metadata || {}) as Record<string, unknown>;
  const firstName = toTrimmed(metadata.first_name);
  const lastName = toTrimmed(metadata.last_name);
  const city = toTrimmed(metadata.city);

  const service = getServiceSupabaseClient();
  const anyDb = service as any;
  const enrichAuthMetadataFromPerson = async (person: {
    first_name?: string | null;
    last_name?: string | null;
    city?: string | null;
  }) => {
    const nextMetadata: Record<string, unknown> = { ...metadata };
    let changed = false;

    const ensureField = (key: "first_name" | "last_name" | "city", value: string) => {
      const current = toTrimmed(nextMetadata[key]);
      if (!current && value) {
        nextMetadata[key] = value;
        changed = true;
      }
    };

    ensureField("first_name", toTrimmed(person.first_name));
    ensureField("last_name", toTrimmed(person.last_name));
    ensureField("city", toTrimmed(person.city));

    if (!changed) return;

    const authUpdate = await service.auth.admin.updateUserById(user.id, {
      user_metadata: nextMetadata
    });

    if (authUpdate.error) throw authUpdate.error;
  };

  const byAuth = await anyDb
    .from("persons")
    .select("id, first_name, last_name, city")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (byAuth.error) throw byAuth.error;

  const updatePayload: Record<string, unknown> = {
    email,
    auth_user_id: user.id
  };

  if (firstName) updatePayload.first_name = firstName;
  if (lastName) updatePayload.last_name = lastName;
  if (city) updatePayload.city = city;

  if (byAuth.data?.id) {
    const updated = await anyDb
      .from("persons")
      .update(updatePayload)
      .eq("id", byAuth.data.id)
      .select("id, first_name, last_name, city")
      .single();
    if (updated.error) throw updated.error;
    await enrichAuthMetadataFromPerson(updated.data);
    return;
  }

  const byEmail = await anyDb
    .from("persons")
    .select("id, first_name, last_name, city")
    .eq("email", email)
    .maybeSingle();

  if (byEmail.error) throw byEmail.error;

  if (byEmail.data?.id) {
    const updated = await anyDb
      .from("persons")
      .update(updatePayload)
      .eq("id", byEmail.data.id)
      .select("id, first_name, last_name, city")
      .single();
    if (updated.error) throw updated.error;
    await enrichAuthMetadataFromPerson(updated.data);
    return;
  }

  const created = await anyDb
    .from("persons")
    .insert({
      email,
      auth_user_id: user.id,
      first_name: firstName || null,
      last_name: lastName || null,
      city: city || null,
      experience_level: "regular",
      tags: []
    })
    .select("id, first_name, last_name, city")
    .single();

  if (created.error) throw created.error;
  await enrichAuthMetadataFromPerson(created.data);
};

const isSignupIntent = (
  user: { user_metadata?: Record<string, unknown> | null },
  next: string
) => {
  const metadata = (user.user_metadata || {}) as Record<string, unknown>;
  return metadata.signup_flow === "admin" && next.startsWith("/onboarding");
};

const isSingerOnlyEmail = async (email: string) => {
  if (!email) return false;
  const service = getServiceSupabaseClient();

  const personRes = await service
    .from("persons")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (personRes.error) throw personRes.error;
  if (!personRes.data?.id) return false;

  const membershipsRes = await service
    .from("choir_memberships")
    .select("roles")
    .eq("person_id", personRes.data.id);

  if (membershipsRes.error) throw membershipsRes.error;

  return classifyUserKindFromMemberships(membershipsRes.data || []) === "singer";
};

type AccessCheckResult = {
  allowed: boolean;
  joinToken: string;
};

const isAllowedAuthAttempt = async (
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  },
  next: string,
  origin: string
): Promise<AccessCheckResult> => {
  const email = normalizeEmail(user.email);
  if (!email) return { allowed: false, joinToken: "" };

  if (isSignupIntent(user, next)) {
    return { allowed: !(await isSingerOnlyEmail(email)), joinToken: "" };
  }

  const service = getServiceSupabaseClient();

  const personRes = await service
    .from("persons")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (personRes.error) throw personRes.error;

  if (personRes.data?.id) {
    return { allowed: true, joinToken: "" };
  }

  const joinToken = getJoinTokenFromNextPath(next, origin);
  if (!joinToken) {
    return { allowed: false, joinToken: "" };
  }

  const hasInvite = await hasPendingInviteWithToken(email, joinToken);
  return { allowed: hasInvite, joinToken: hasInvite ? joinToken : "" };
};

const resolveUserKind = async (user: {
  id: string;
  email?: string | null;
}): Promise<UserKind> => {
  const email = normalizeEmail(user.email);
  if (!email) return "setup";

  const service = getServiceSupabaseClient();
  const anyDb = service as any;

  let personRes = await anyDb
    .from("persons")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (personRes.error) throw personRes.error;

  if (!personRes.data?.id) {
    personRes = await anyDb
      .from("persons")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (personRes.error) throw personRes.error;
  }

  const personId = personRes.data?.id;
  if (!personId) return "setup";

  const membershipsRes = await service
    .from("choir_memberships")
    .select("roles")
    .eq("person_id", personId);

  if (membershipsRes.error) throw membershipsRes.error;
  return classifyUserKindFromMemberships(membershipsRes.data || []);
};

const getPostLoginPath = (next: string, kind: UserKind) => {
  if (kind === "singer") return "/singer-profile";
  if (kind === "setup") return "/onboarding";
  return next;
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = getRequestOrigin(request, requestUrl);
  const code = requestUrl.searchParams.get("code");
  const otpTokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  let response = NextResponse.redirect(new URL(next, origin));

  const carrySessionCookies = (target: NextResponse) => {
    const sessionCookies = response.cookies.getAll();
    for (const cookie of sessionCookies) {
      target.cookies.set(cookie);
    }
    return target;
  };

  const redirectToLogin = (errorCode: string) => {
    const url = new URL("/login", origin);
    url.searchParams.set("next", next);
    url.searchParams.set("error", errorCode);
    response = carrySessionCookies(NextResponse.redirect(url));
    return response;
  };

  const redirectToPath = (path: string) => {
    response = carrySessionCookies(NextResponse.redirect(new URL(path, origin)));
    return response;
  };

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...(options as object) });
          });
        }
      }
    }
  ) as any;

  if (!code && !(otpTokenHash && isEmailOtpType(type))) {
    return redirectToLogin("callback_params_missing");
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return redirectToLogin("callback_exchange_failed");
    }
  } else if (otpTokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: otpTokenHash
    });
    if (error) {
      return redirectToLogin("callback_verify_failed");
    }
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirectToLogin("callback_user_failed");
  }

  let accessCheck: AccessCheckResult = { allowed: false, joinToken: "" };
  try {
    accessCheck = await isAllowedAuthAttempt(user, next, origin);
  } catch (accessError) {
    console.error("callback access check failed", accessError);
    return redirectToLogin("callback_access_check_failed");
  }

  if (!accessCheck.allowed) {
    redirectToLogin("not_allowed");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("callback signout failed", signOutError);
    }
    return response;
  }

  try {
    const email = normalizeEmail(user.email);
    if (email && accessCheck.joinToken) {
      await finalizePendingInvite(email, accessCheck.joinToken);
    }
  } catch (inviteError) {
    console.error("callback invite finalize failed", inviteError);
    const inviteErrorMessage =
      inviteError instanceof Error
        ? inviteError.message || ""
        : typeof inviteError === "object" &&
            inviteError !== null &&
            "message" in inviteError
          ? String((inviteError as { message?: unknown }).message ?? "")
          : "";
    const parsed = parseCapacityError(inviteErrorMessage);
    if (parsed?.type === "voice_capacity_exceeded") {
      return redirectToLogin("voice_capacity_exceeded");
    }
    if (parsed?.type === "voice_missing_for_capacity") {
      return redirectToLogin("voice_missing_for_capacity");
    }
    return redirectToLogin("callback_invite_finalize_failed");
  }

  try {
    await syncPersonFromAuth(user);
  } catch (syncError) {
    console.error("callback person sync failed", syncError);
    return redirectToLogin("callback_person_sync_failed");
  }

  let userKind: UserKind = "setup";
  try {
    userKind = await resolveUserKind(user);
  } catch (kindError) {
    console.error("callback user kind resolve failed", kindError);
    return redirectToLogin("callback_user_kind_failed");
  }

  return redirectToPath(getPostLoginPath(next, userKind));
}
