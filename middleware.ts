import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
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

const isProtectedPath = (pathname: string) =>
  protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

const isAuthSessionMissing = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: string }).name;
  const message = (error as { message?: string }).message || "";
  return name === "AuthSessionMissingError" || message.includes("Auth session missing");
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        request.cookies.set({ name, value, ...(options as object) });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value, ...(options as object) });
      },
      remove(name: string, options: Record<string, unknown>) {
        request.cookies.set({ name, value: "", ...(options as object) });
        response = NextResponse.next({ request });
        response.cookies.set({
          name,
          value: "",
          ...(options as object),
          maxAge: 0
        });
      }
    }
  });

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

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

  if ((pathname === "/login" || pathname === "/signup") && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
