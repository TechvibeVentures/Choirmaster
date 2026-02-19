import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";
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

  const byAuth = await anyDb
    .from("persons")
    .select("id")
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
      .select("id")
      .single();
    if (updated.error) throw updated.error;
    return;
  }

  const byEmail = await anyDb
    .from("persons")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (byEmail.error) throw byEmail.error;

  if (byEmail.data?.id) {
    const updated = await anyDb
      .from("persons")
      .update(updatePayload)
      .eq("id", byEmail.data.id)
      .select("id")
      .single();
    if (updated.error) throw updated.error;
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
    .select("id")
    .single();

  if (created.error) throw created.error;
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  let response = NextResponse.redirect(new URL(next, requestUrl.origin));

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value, ...(options as object) });
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({
            name,
            value: "",
            ...(options as object),
            maxAge: 0
          });
        }
      }
    }
  ) as any;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const url = new URL("/login", requestUrl.origin);
      url.searchParams.set("next", next);
      url.searchParams.set("error", "callback_exchange_failed");
      return NextResponse.redirect(url);
    }
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError) {
      const url = new URL("/login", requestUrl.origin);
      url.searchParams.set("next", next);
      url.searchParams.set("error", "callback_user_failed");
      return NextResponse.redirect(url);
    }
    if (user) {
      try {
        await syncPersonFromAuth(user);
      } catch (syncError) {
        console.error("callback person sync failed", syncError);
        const url = new URL("/login", requestUrl.origin);
        url.searchParams.set("next", next);
        url.searchParams.set("error", "callback_person_sync_failed");
        return NextResponse.redirect(url);
      }
    }
    return response;
  }

  if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash
    });
    if (error) {
      const url = new URL("/login", requestUrl.origin);
      url.searchParams.set("next", next);
      url.searchParams.set("error", "callback_verify_failed");
      return NextResponse.redirect(url);
    }
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError) {
      const url = new URL("/login", requestUrl.origin);
      url.searchParams.set("next", next);
      url.searchParams.set("error", "callback_user_failed");
      return NextResponse.redirect(url);
    }
    if (user) {
      try {
        await syncPersonFromAuth(user);
      } catch (syncError) {
        console.error("callback person sync failed", syncError);
        const url = new URL("/login", requestUrl.origin);
        url.searchParams.set("next", next);
        url.searchParams.set("error", "callback_person_sync_failed");
        return NextResponse.redirect(url);
      }
    }
    return response;
  }

  const url = new URL("/login", requestUrl.origin);
  url.searchParams.set("next", next);
  url.searchParams.set("error", "callback_params_missing");
  return NextResponse.redirect(url);
}
