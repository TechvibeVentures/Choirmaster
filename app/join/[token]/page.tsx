"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { formatMagicLinkError } from "@/lib/supabase/authErrors";

type ValidationPayload = {
  valid: boolean;
  token?: string;
  project?: {
    id: string;
    name: string;
    choir_id: string;
  };
  choir?: {
    id: string;
    name: string;
    city: string;
  };
  prefill?: {
    first_name: string;
    last_name: string;
    email: string;
    voice: string;
  };
  emailLocked?: boolean;
};

export default function JoinTokenPage({
  params
}: {
  params: { token: string };
}) {
  const token = useMemo(() => {
    try {
      return decodeURIComponent(params.token);
    } catch {
      return params.token;
    }
  }, [params.token]);

  const [loading, setLoading] = useState(true);
  const [validatingError, setValidatingError] = useState("");
  const [payload, setPayload] = useState<ValidationPayload | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [voice, setVoice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setValidatingError("");
      try {
        const response = await fetch(`/api/join/validate?token=${encodeURIComponent(token)}`);
        const body = await response.json();
        if (!response.ok) {
          setPayload(body);
          setValidatingError(body.error || "Token ist ungültig.");
          return;
        }
        setPayload(body);
        if (body.prefill) {
          setFirstName(body.prefill.first_name ?? "");
          setLastName(body.prefill.last_name ?? "");
          setEmail(body.prefill.email ?? "");
          setVoice(body.prefill.voice ?? "");
        }
      } catch {
        setValidatingError("Token konnte nicht geprüft werden.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [token]);

  const canSubmit = useMemo(
    () => Boolean(payload?.valid && !submitting && email.trim()),
    [payload?.valid, submitting, email]
  );

  const completeJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitError("");
    setSent(false);
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await fetch("/api/join/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          email: normalizedEmail,
          first_name: firstName,
          last_name: lastName,
          voice: voice || null
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          typeof body.error === "string" && body.error
            ? body.error
            : "Beitritt konnte nicht abgeschlossen werden."
        );
      }

      const supabase = getBrowserSupabaseClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", "/singer-profile");
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: callbackUrl.toString()
        }
      });

      if (error) throw error;
      setSent(true);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Beitritt konnte nicht abgeschlossen werden.";
      if (message === "voice_capacity_exceeded") {
        setSubmitError(
          "Beitritt nicht möglich: Für diese Stimme ist das Ensemble aktuell voll. Bitte Admin kontaktieren."
        );
      } else if (message === "voice_missing_for_capacity") {
        setSubmitError(
          "Beitritt nicht möglich: Für dein Profil fehlt eine gültige Stimme. Bitte Admin kontaktieren."
        );
      } else if (message.includes("Beitritt konnte nicht abgeschlossen werden")) {
        setSubmitError(message);
      } else {
        setSubmitError(formatMagicLinkError(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Projektbeitritt</div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Token wird geprüft...</p>
        ) : null}

        {!loading && (!payload?.valid || validatingError) ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {validatingError || "Token ist ungültig."}
            <div className="mt-3">
              <Link href="/" className="text-xs font-semibold text-rose-700 underline">
                Zurück zur Startseite
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && payload?.valid ? (
          <>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">
              {payload.project?.name || "Projekt"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {payload.choir?.name || "Ensemble"}
              {payload.choir?.city ? ` · ${payload.choir.city}` : ""}
            </p>

            <form onSubmit={completeJoin} className="mt-6 grid gap-4">
              <label className="text-sm text-slate-600">
                E-Mail
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  readOnly={payload.emailLocked === true}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                  type="email"
                  placeholder="name@chor.de"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? "Speichert..." : "Beitritt abschließen"}
              </button>
            </form>
            {sent ? (
              <p className="mt-3 text-xs text-emerald-700">
                Magic Link wurde versendet. Bitte E-Mail öffnen und den Link anklicken.
              </p>
            ) : null}
            {submitError ? (
              <p className="mt-3 text-xs text-rose-600">{submitError}</p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
