import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Playfair_Display, Manrope } from "next/font/google";
import EnsembleOnboardingFlow from "@/components/EnsembleOnboardingFlow";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"]
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

export default async function OnboardingPage() {
  const supabase = getServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (
    error &&
    !(error.name === "AuthSessionMissingError" || error.message?.includes("Auth session missing"))
  ) {
    throw error;
  }

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const userMetadata = (user.user_metadata || {}) as Record<string, unknown>;
  const profileFirstName =
    typeof userMetadata.first_name === "string" ? userMetadata.first_name.trim() : "";
  const profileLastName =
    typeof userMetadata.last_name === "string" ? userMetadata.last_name.trim() : "";
  const profileCity =
    typeof userMetadata.city === "string" ? userMetadata.city.trim() : "";

  return (
    <div className={`${body.className} min-h-screen bg-white text-slate-900`}>
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute left-1/2 top-[-160px] h-[380px] w-[380px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 40% 30%, rgba(169,255,144,0.35), rgba(153,187,221,0.2), rgba(255,255,255,0))"
          }}
        />
        <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-900">
                CM
              </div>
              <div>
                <div className={`${display.className} text-lg font-semibold`}>
                  Choirmaster
                </div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Onboarding
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück zur Startseite
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Einloggen
              </Link>
            </div>
          </header>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <EnsembleOnboardingFlow
            open
            variant="page"
            includeProfileStep
            initialProfile={{
              firstName: profileFirstName,
              lastName: profileLastName,
              email: user.email || "",
              city: profileCity,
              timezone: "Europe/Zurich"
            }}
          />
        </div>
      </div>
    </div>
  );
}
