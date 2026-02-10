import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Link2,
  Sparkles,
  Users
} from "lucide-react";
import { Playfair_Display, Manrope } from "next/font/google";
import { strings } from "@/lib/i18n";
import {
  choirs,
  concertsByProject,
  projects,
  rehearsalsByProject
} from "@/lib/mockData";
import { formatDateRange, formatTimeRange, formatWeekdays } from "@/lib/format";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"]
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

const featureCards = [
  {
    title: "Projektübersichten ohne Reibung",
    description:
      "Halte Projekte, Konzerte und Proben in einer klaren Struktur. Stimmen sehen genau das, was sie brauchen.",
    icon: CalendarRange
  },
  {
    title: "Sänger:innen über Links einbinden",
    description:
      "Keine App-Pflicht: Einladungen funktionieren über geteilte Links und Magic Links per E-Mail.",
    icon: Link2
  },
  {
    title: "Mehrere Ensembles, ein Arbeitsraum",
    description:
      "Leitungsteams wechseln nahtlos zwischen Ensembles, Projekten und Rollen.",
    icon: Users
  }
];

const steps = [
  {
    title: "Profil erstellen",
    description: "Leitung oder Vorstand anlegen und Zuständigkeiten festlegen."
  },
  {
    title: "Ensembleprofil definieren",
    description: "Name, Ort, Typ und Probenrhythmus eintragen."
  },
  {
    title: "Sänger:innen koordinieren",
    description: "Einladen, Rollen setzen und Rückmeldungen einsammeln."
  }
];

const previewChoir = {
  name: "Stadtchor Aurora",
  city: "Basel"
};
const previewProjectName = "Frühlingsprogramm";
const previewProject = projects[0];
const previewRehearsals = previewProject
  ? rehearsalsByProject[previewProject.id] ?? []
  : [];
const previewConcerts = previewProject
  ? concertsByProject[previewProject.id] ?? []
  : [];
const previewRehearsalLine = previewProject
  ? `${formatWeekdays(previewProject.rehearsal_facts.weekdays)} · ${formatTimeRange(
      previewProject.rehearsal_facts.start_time,
      previewProject.rehearsal_facts.end_time
    )}`
  : "Probe nach Absprache";

export default function Home() {
  return (
    <div className={`${body.className} min-h-screen bg-white text-slate-900`}>
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(169,255,144,0.55), rgba(139,218,231,0.25), rgba(255,255,255,0))"
          }}
        />
        <div
          className="pointer-events-none absolute right-[-120px] top-24 h-[320px] w-[320px] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 70% 30%, rgba(153,187,221,0.5), rgba(158,233,137,0.15), rgba(255,255,255,0))"
          }}
        />

        <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pb-8 pt-8 sm:px-6">
          <div className="flex items-center">
            <Image
              src="/Choirmaster Logo Transparent.svg"
              alt="Choirmaster"
              width={220}
              height={56}
              className="h-12 w-auto"
              priority
            />
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
            >
              {strings.marketing.heroSecondary}
            </Link>
          </nav>
        </header>

        <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-16 sm:px-6">
          <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {strings.marketing.heroEyebrow}
              </div>
              <h1
                className={`${display.className} mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl lg:text-5xl`}
              >
                {strings.marketing.heroTitle}
              </h1>
              <p className="mt-4 text-base text-slate-600 sm:text-lg">
                {strings.marketing.heroSubtitle}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {strings.marketing.heroPrimary}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-[32px] border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white" />
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Aktueller Überblick
                    </div>
                    <div className={`${display.className} mt-2 text-xl font-semibold`}>
                      {previewChoir.name} · {previewChoir.city}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {previewRehearsalLine}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {choirs.length} Ensembles
                  </div>
                </div>
                <div className="mt-6 grid gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          {previewProjectName}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {previewConcerts.length} Konzerte · {previewRehearsals.length} Proben
                        </div>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                        {previewProject
                          ? formatDateRange(
                              previewProject.date_range.start,
                              previewProject.date_range.end
                            )
                          : "Planung"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      Rückmeldungen laufen · Status wird aktualisiert
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          Stimmenstatus
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Präsenz & Rollen im Blick
                        </div>
                      </div>
                      <Sparkles className="h-4 w-4 text-slate-300" />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      {[
                        { label: "Sopran", value: "12", color: "var(--voice-soprano)" },
                        { label: "Alt", value: "9", color: "var(--voice-alto)" },
                        { label: "Tenor", value: "6", color: "var(--voice-tenor)" },
                        { label: "Bass", value: "7", color: "var(--voice-bass)" }
                      ].map((voice) => (
                        <div
                          key={voice.label}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: voice.color }}
                            />
                            {voice.label}
                          </span>
                          <span className="font-semibold text-slate-700">
                            {voice.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {strings.marketing.trustTitle}
                </div>
                <h2 className={`${display.className} mt-3 text-2xl font-semibold`}>
                  {strings.marketing.trustSubtitle}
                </h2>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
                Multi-Choir Architektur
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {featureCards.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <feature.icon className="h-5 w-5 text-slate-400" />
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-slate-50/70 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {strings.marketing.stepsTitle}
                </div>
                <h2 className={`${display.className} mt-3 text-2xl font-semibold`}>
                  {strings.marketing.stepsSubtitle}
                </h2>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                {strings.marketing.heroPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
                      {index + 1}
                    </span>
                    {step.title}
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {strings.marketing.featureTitle}
              </div>
              <h2 className={`${display.className} mt-3 text-2xl font-semibold`}>
                {strings.marketing.featureSubtitle}
              </h2>
              <div className="mt-6 space-y-3 text-sm text-slate-600">
                {[
                  "Proben und Konzerte mit Echtzeit-Rückmeldungen verfolgen",
                  "Stimmgruppen und Rollen pro Projekt definieren",
                  "Shareable Links für Sänger:innen und Gäste",
                  "Gemeinsamer Projektstand für Vorstand und Leitung"
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-slate-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Ensemble-Status
                  </div>
                  <div className={`${display.className} mt-3 text-2xl font-semibold`}>
                    Alles Wichtige in einem Blick
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  Live-Status
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                {[
                  {
                    label: "Offene Rückmeldungen",
                    value: "8 Sänger:innen",
                    color: "var(--voice-alto)"
                  },
                  {
                    label: "Nächste Probe",
                    value: "11. Feb · Aula City",
                    color: "var(--voice-tenor)"
                  },
                  {
                    label: "Projektbeteiligung",
                    value: "28 bestätigt",
                    color: "var(--voice-soprano)"
                  }
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-2 text-slate-600">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      {row.label}
                    </div>
                    <span className="font-semibold text-slate-800">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {strings.marketing.ctaTitle}
            </div>
            <h2 className={`${display.className} mt-4 text-2xl font-semibold`}>
              {strings.marketing.ctaSubtitle}
            </h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
              >
                {strings.marketing.heroPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              {strings.marketing.footerNote}
            </p>
          </section>
          <footer className="border-t border-slate-200 py-8 text-sm text-slate-500">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/Choirmaster Logo Transparent.svg"
                  alt="Choirmaster"
                  width={170}
                  height={42}
                  className="h-10 w-auto"
                />
                <span>© 2026 Choirmaster</span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>Chorverwaltung</span>
                <span>Mehrere Ensembles</span>
                <span>Geteilte Links</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
