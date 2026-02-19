import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

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
    return response;
  }

  const url = new URL("/login", requestUrl.origin);
  url.searchParams.set("next", next);
  url.searchParams.set("error", "callback_params_missing");
  return NextResponse.redirect(url);
}
