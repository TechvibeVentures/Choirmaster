"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, User } from "lucide-react";
import { Playfair_Display, Manrope } from "next/font/google";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { formatMagicLinkError } from "@/lib/supabase/authErrors";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"]
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLoginHint, setShowLoginHint] = useState(false);

  const startSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;

    setErrorMessage(null);
    setShowLoginHint(false);
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const preflightResponse = await fetch("/api/auth/preflight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: normalizedEmail,
          flow: "signup"
        })
      });
      const preflightPayload = await preflightResponse
        .json()
        .catch(() => ({ allowed: false, reason: "internal_error" }));

      if (!preflightResponse.ok || !preflightPayload.allowed) {
        const reason =
          typeof preflightPayload.reason === "string"
            ? preflightPayload.reason
            : "internal_error";

        if (reason === "singer_only") {
          setErrorMessage(
            "Diese E-Mail ist bereits als Singer eingeladen. Bitte melde dich über Login an."
          );
          setShowLoginHint(true);
        } else {
          setErrorMessage("Registrierung ist aktuell nicht möglich. Bitte versuche es später erneut.");
        }
        setSent(false);
        return;
      }

      const supabase = getBrowserSupabaseClient();
      const params = new URLSearchParams();
      params.set("next", "/onboarding");

      const redirectTo = `${window.location.origin}/auth/callback?${params.toString()}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            signup_flow: "admin"
          }
        }
      });

      if (error) throw error;
      setSent(true);
    } catch (error) {
      console.error("signup magic link failed", error);
      setErrorMessage(formatMagicLinkError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${body.className} min-h-screen bg-white text-slate-900`}>
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute left-1/2 top-[-140px] h-[360px] w-[360px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 40% 30%, rgba(169,255,144,0.4), rgba(139,218,231,0.2), rgba(255,255,255,0))"
          }}
        />
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10 sm:px-6">
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <Image
              src="/Choirmaster Logo Transparent.svg"
              alt="Choirmaster"
              width={170}
              height={42}
              className="h-9 w-auto"
              priority
            />
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Link>
          </header>

          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Profil erstellen
              </div>
              <h1 className={`${display.className} mt-4 text-3xl font-semibold`}>
                Starte mit deinem Profil für das neue Ensemble.
              </h1>
              <form onSubmit={startSignup} className="mt-8 grid gap-4">
                <label className="text-sm text-slate-600">
                  Vorname
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Maria"
                      className="w-full border-none text-sm text-slate-900 focus:outline-none"
                    />
                  </div>
                </label>
                <label className="text-sm text-slate-600">
                  Nachname
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Haller"
                      className="w-full border-none text-sm text-slate-900 focus:outline-none"
                    />
                  </div>
                </label>
                <label className="text-sm text-slate-600">
                  E-Mail
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@chor.de"
                      className="w-full border-none text-sm text-slate-900 focus:outline-none"
                      required
                    />
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading ? "Senden..." : "Neues Ensemble erstellen"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
              <p className="mt-4 text-xs text-slate-500">
                {sent
                  ? "Magic Link wurde gesendet. Öffne die E-Mail, um mit dem Onboarding zu starten."
                  : "Im nächsten Schritt legst du Ensemble, Probenrhythmus und Einladungen fest."}
              </p>
              {errorMessage ? (
                <p className="mt-2 text-xs text-rose-600">{errorMessage}</p>
              ) : null}
              {showLoginHint ? (
                <p className="mt-2 text-xs text-slate-600">
                  Bereits eingeladen?{" "}
                  <Link href="/login" className="font-semibold text-slate-800 underline">
                    Hier einloggen
                  </Link>
                </p>
              ) : null}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Was du gleich anlegst
              </div>
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                {[
                  "Ensembleprofil mit Probenrhythmus",
                  "Stimmverteilung und Rollen",
                  "Einladungen für Sänger:innen"
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                Danach kannst du Projekte und Repertoire sofort hinzufügen.
              </div>
              <Link
                href="/login"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Bereits ein Konto? Einloggen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
