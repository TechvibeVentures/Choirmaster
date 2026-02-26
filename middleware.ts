import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  classifyUserKindFromMemberships,
  normalizeEmail,
  type UserKind
} from "@/lib/auth/userAccess";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

const protectedPrefixes = [
  "/dashboard",
  "/projects",
  "/singers",
  "/sheets",
  "/admin-profile",
  "/messages",
  "/onboarding",
  "/singer-profile"
];

const singerAllowedPrefixes = ["/singer-profile", "/join"];
const setupAllowedPrefixes = ["/onboarding", "/join"];

const isProtectedPath = (pathname: string) =>
  protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

const matchesPrefix = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const isBypassPath = (pathname: string) =>
  pathname.startsWith("/api") ||
  pathname.startsWith("/auth/callback") ||
  pathname.startsWith("/_next") ||
  pathname === "/favicon.ico" ||
  pathname.includes(".");

const isAuthSessionMissing = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: string }).name;
  const message = (error as { message?: string }).message || "";
  return name === "AuthSessionMissingError" || message.includes("Auth session missing");
};

const isCorruptedAuthSession = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const message = (error as { message?: string }).message || "";
  return message.includes("Cannot create property 'user' on string");
};

const clearSupabaseAuthCookies = (request: NextRequest, response: NextResponse) => {
  const authCookies = request.cookies
    .getAll()
    .filter((cookie) => cookie.name.includes("sb-") || cookie.name.includes("-auth-token"));

  for (const cookie of authCookies) {
    request.cookies.set(cookie.name, "");
    response.cookies.set({
      name: cookie.name,
      value: "",
      maxAge: 0,
      path: "/"
    });
  }
};

const resolveUserKind = async (
  supabase: any,
  user: { id: string; email?: string | null }
): Promise<UserKind> => {
  const email = normalizeEmail(user.email);
  if (!email) return "setup";

  let personRes = await (supabase as any)
    .from("persons")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (personRes.error) throw personRes.error;

  if (!personRes.data?.id) {
    personRes = await (supabase as any)
      .from("persons")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (personRes.error) throw personRes.error;
  }

  const personId = personRes.data?.id;
  if (!personId) return "setup";

  const membershipsRes = await supabase
    .from("choir_memberships")
    .select("roles")
    .eq("person_id", personId);

  if (membershipsRes.error) throw membershipsRes.error;

  return classifyUserKindFromMemberships(membershipsRes.data || []);
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({ name, value, ...(options as object) });
        });
      }
    }
  });

  let user: { id: string; email?: string | null } | null = null;
  let userError: unknown = null;
  try {
    const userResult = await supabase.auth.getUser();
    user = userResult.data.user;
    userError = userResult.error;
  } catch (error) {
    userError = error;
  }

  if (isCorruptedAuthSession(userError)) {
    clearSupabaseAuthCookies(request, response);
    user = null;
    userError = null;
  }

  if (userError && !isAuthSessionMissing(userError)) {
    throw userError;
  }

  const pathname = request.nextUrl.pathname;

  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (!user || isBypassPath(pathname)) {
    return response;
  }

  const userKind = await resolveUserKind(supabase, user);

  if (pathname === "/login" || pathname === "/signup") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      userKind === "admin"
        ? "/dashboard"
        : userKind === "singer"
        ? "/singer-profile"
        : "/onboarding";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (userKind === "singer" && !matchesPrefix(pathname, singerAllowedPrefixes)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/singer-profile";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (userKind === "setup" && !matchesPrefix(pathname, setupAllowedPrefixes)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/onboarding";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
