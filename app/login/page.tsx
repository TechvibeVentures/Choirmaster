import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Playfair_Display, Manrope } from "next/font/google";
import { strings } from "@/lib/i18n";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"]
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

export default function LoginPage() {
  return (
    <div className={`${body.className} min-h-screen bg-white text-slate-900`}>
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute left-1/2 top-[-120px] h-[320px] w-[320px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 40% 30%, rgba(139,218,231,0.4), rgba(255,255,255,0))"
          }}
        />
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10 sm:px-6">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" />
            {strings.auth.loginBack}
          </Link>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {strings.auth.loginTitle}
              </div>
              <h1 className={`${display.className} mt-4 text-3xl font-semibold`}>
                {strings.auth.loginSubtitle}
              </h1>
              <form className="mt-8 grid gap-4">
                <label className="text-sm text-slate-600">
                  {strings.auth.loginEmailLabel}
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="name@chor.de"
                      className="w-full border-none text-sm text-slate-900 focus:outline-none"
                    />
                  </div>
                </label>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  {strings.auth.loginAction}
                </button>
              </form>
              <p className="mt-4 text-xs text-slate-500">
                {strings.auth.loginHint}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Was passiert als nächstes?
              </div>
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                {[
                  "Du bekommst einen Magic Link per E-Mail.",
                  "Der Link öffnet direkt deinen Choirmaster-Arbeitsraum.",
                  "Du bleibst für 90 Tage angemeldet – ohne Passwort."
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                Du hast noch kein Ensemble? Dann starte mit dem Onboarding und lade dein Team ein.
              </div>
              <Link
                href="/signup"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Neues Ensemble erstellen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
