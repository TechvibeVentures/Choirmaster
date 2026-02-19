"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Link2,
  Mail,
  Upload,
  UserPlus
} from "lucide-react";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import { useAppData } from "@/hooks/useAppData";
import type { Project, Voice } from "@/lib/domain/types";
import {
  formatDate,
  formatDateRange,
  formatTimeRange,
  formatWeekdays
} from "@/lib/format";
import { strings } from "@/lib/i18n";
import { getVoiceLabel } from "@/lib/labels";

type InviteRow = {
  id: string;
  name: string;
  email: string;
  voice: Voice | "";
};

const voiceOrder: Voice[] = ["Soprano", "Alto", "Tenor", "Bass"];

const voiceColors: Record<Voice, string> = {
  Soprano: "var(--voice-soprano)",
  Alto: "var(--voice-alto)",
  Tenor: "var(--voice-tenor)",
  Bass: "var(--voice-bass)"
};

const choirTypeLabels: Record<string, string> = {
  mixed: "Gemischter Chor",
  chamber: "Kammerchor",
  project: "Projektchor"
};

const stepLabels = [
  strings.onboarding.stepChoir,
  strings.onboarding.stepChannels,
  strings.onboarding.stepInvites,
  strings.onboarding.stepReview
];

const channelOptions = [
  {
    id: "link",
    title: "Einladungslink",
    description: "Sänger tragen sich selbst ein und wählen ihre Stimme.",
    hint: "Minimaler Aufwand",
    icon: Link2
  },
  {
    id: "email",
    title: "Direkte Einladungen",
    description: "Ein paar gezielte Sänger:innen direkt ansprechen.",
    hint: "Persönlich & schnell",
    icon: Mail
  },
  {
    id: "import",
    title: "CSV-Import",
    description: "Bestehende Kontaktlisten in wenigen Minuten einlesen.",
    hint: "Für große Listen",
    icon: Upload
  },
  {
    id: "personal",
    title: "Persönlich ansprechen",
    description: "Einzelne Favoriten manuell ergänzen.",
    hint: "Feinschliff",
    icon: UserPlus
  }
];

const profileFields = [
  { id: "name", label: "Name", required: true },
  { id: "email", label: "E-Mail", required: true },
  { id: "voice", label: "Stimmgruppe", required: false },
  { id: "experience", label: "Erfahrungsstand", required: false },
  { id: "city", label: "Wohnort", required: false },
  { id: "notes", label: "Notizen", required: false }
];

const voiceSplitDefaults = [
  { label: "1", count: 4 },
  { label: "2", count: 4 },
  { label: "3", count: 0 }
];

const getInitialInviteRows = (): InviteRow[] => [
  { id: "row-1", name: "Anna Berger", email: "anna@example.com", voice: "" },
  { id: "row-2", name: "Jonas Frei", email: "jonas@example.com", voice: "" },
  { id: "row-3", name: "", email: "", voice: "" }
];

const getProjectStatus = (project: Project) => {
  const today = new Date();
  const start = new Date(`${project.date_range.start}T00:00:00`);
  const end = new Date(`${project.date_range.end}T00:00:00`);
  if (today < start) {
    return {
      label: strings.projects.statusUpcoming,
      date: formatDate(project.date_range.start),
      className: "border-amber-200 bg-amber-50 text-amber-700"
    };
  }
  if (today > end) {
    return {
      label: strings.projects.statusArchived,
      date: formatDate(project.date_range.end),
      className: "border-slate-200 bg-slate-50 text-slate-500"
    };
  }
  return {
    label: strings.projects.statusActive,
    date: formatDate(project.date_range.end),
    className: "border-emerald-200 bg-emerald-50 text-emerald-700"
  };
};

export default function PeopleOnboardingPage() {
  const { choirs, allProjects } = useAppData();
  const [step, setStep] = useState(0);
  const [selectedChoirId, setSelectedChoirId] = useState(
    choirs[0]?.id ?? ""
  );
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "link",
    "email"
  ]);
  const [inviteRows, setInviteRows] = useState<InviteRow[]>(
    getInitialInviteRows()
  );
  const [inviteMessage, setInviteMessage] = useState(
    "Hallo! Wir suchen Verstärkung für unser nächstes Projekt. Hier findest du alle Infos und kannst dich direkt eintragen."
  );
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [commitStats, setCommitStats] = useState<{
    createdPersons: number;
    upsertedMemberships: number;
    upsertedParticipants: number;
  } | null>(null);

  const handleComingSoon = () => {
    window.alert("Diese Funktion kommt in einer späteren Version der App.");
  };

  const choirProjects = useMemo(
    () => allProjects.filter((project) => project.choir_id === selectedChoirId),
    [allProjects, selectedChoirId]
  );

  useEffect(() => {
    setSelectedProjectId(choirProjects[0]?.id ?? "");
  }, [choirProjects]);

  useEffect(() => {
    if (!selectedProjectId) {
      setInviteToken("");
      return;
    }

    const run = async () => {
      try {
        const response = await fetch(`/api/projects/${selectedProjectId}/access-token`);
        if (!response.ok) return;
        const payload = await response.json();
        setInviteToken(payload.token || "");
      } catch {
        setInviteToken("");
      }
    };

    void run();
  }, [selectedProjectId]);

  const selectedChoir = choirs.find((choir) => choir.id === selectedChoirId);
  const selectedProject = choirProjects.find(
    (project) => project.id === selectedProjectId
  );

  const activeChannels = useMemo(
    () =>
      channelOptions.filter((option) => selectedChannels.includes(option.id)),
    [selectedChannels]
  );

  const filledInvites = inviteRows.filter(
    (row) => row.name.trim() || row.email.trim()
  );

  const inviteLink = inviteToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${inviteToken}`
    : "";

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const updateInviteRow = (
    id: string,
    key: keyof InviteRow,
    value: string
  ) => {
    setInviteRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [key]: value } : row))
    );
  };

  const addInviteRow = () => {
    setInviteRows((rows) => [
      ...rows,
      { id: `row-${rows.length + 1}`, name: "", email: "", voice: "" }
    ]);
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      window.alert("Link konnte nicht kopiert werden.");
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleNext = () =>
    setStep((prev) => Math.min(prev + 1, stepLabels.length - 1));
  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 0));

  const handleCommit = async () => {
    if (!selectedProjectId) {
      window.alert("Bitte zuerst ein Projekt auswählen.");
      return;
    }

    setSubmitting(true);
    try {
      const payloadInvites = filledInvites
        .filter((row) => row.email.trim())
        .map((row) => ({
          name: row.name.trim(),
          email: row.email.trim().toLowerCase(),
          voice: row.voice || null
        }));

      const response = await fetch(
        `/api/projects/${selectedProjectId}/invites/commit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ invites: payloadInvites })
        }
      );

      if (!response.ok) {
        throw new Error("commit failed");
      }

      const result = await response.json();
      setCommitStats(result);
    } catch {
      window.alert("Einladungen konnten nicht gespeichert werden.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              {strings.onboarding.subtitle}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              {strings.onboarding.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Von der Auswahl des Ensembles bis zur fertigen Einladung – alles
              in einem Ablauf.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
              Schritt {step + 1} von {stepLabels.length}
            </span>
            <Link
              href="/singers"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Zur Übersicht
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {stepLabels.map((label, index) => {
          const isActive = step === index;
          const isDone = step > index;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                isActive
                  ? "border-slate-900 bg-white text-slate-900"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                    isDone
                      ? "border-slate-900 bg-slate-900 text-white"
                      : isActive
                      ? "border-slate-900 text-slate-900"
                      : "border-slate-200 text-slate-400"
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="font-medium">{label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {step === 0 ? (
            <>
              <Card>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Ensemble
                </div>
                <div className="mt-3 space-y-3">
                  {choirs.map((choir) => (
                    <label
                      key={choir.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                        selectedChoirId === choir.id
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="choir"
                        value={choir.id}
                        checked={selectedChoirId === choir.id}
                        onChange={() => setSelectedChoirId(choir.id)}
                        className="mt-1 h-4 w-4 border-slate-300 text-slate-900"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {choir.name}
                          </span>
                          <Badge>{choir.city}</Badge>
                          <Badge className="text-slate-500">
                            {choirTypeLabels[choir.type] ?? choir.type}
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Probe: {formatWeekdays(choir.rehearsal_pattern.weekdays)} ·{" "}
                          {formatTimeRange(
                            choir.rehearsal_pattern.start_time,
                            choir.rehearsal_pattern.end_time
                          )}
                        </div>
                        {choir.rehearsal_pattern.default_location ? (
                          <div className="mt-1 text-xs text-slate-400">
                            Ort: {choir.rehearsal_pattern.default_location}
                          </div>
                        ) : null}
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleComingSoon}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-slate-300"
                >
                  + Neues Ensemble hinzufügen
                </button>
              </Card>

              <Card>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Projekt
                </div>
                <div className="mt-3 space-y-3">
                  {choirProjects.map((project) => {
                    const status = getProjectStatus(project);
                    return (
                      <label
                        key={project.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                          selectedProjectId === project.id
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="project"
                          value={project.id}
                          checked={selectedProjectId === project.id}
                          onChange={() => setSelectedProjectId(project.id)}
                          className="mt-1 h-4 w-4 border-slate-300 text-slate-900"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {project.name}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            Zeitraum: {formatDateRange(
                              project.date_range.start,
                              project.date_range.end
                            )}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            Zieltermin: {status.date}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                  {choirProjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                      Für dieses Ensemble gibt es noch kein Projekt. Lege zuerst
                      ein Projekt an oder wähle ein anderes Ensemble.
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={handleComingSoon}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-slate-300"
                >
                  + Neues Projekt anlegen
                </button>
              </Card>

              <Card>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Stimmverteilung
                </div>
                <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {voiceOrder.map((voice) => (
                    <div
                      key={voice}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: voiceColors[voice] }}
                        />
                        <span>{getVoiceLabel(voice)}</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {voiceSplitDefaults.map((split) => (
                          <div
                            key={`${voice}-${split.label}`}
                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1"
                          >
                            <span className="text-xs text-slate-500">
                              {getVoiceLabel(voice)} {split.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleComingSoon}
                                className="h-6 w-6 rounded-full border border-slate-200 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                              >
                                –
                              </button>
                              <span className="min-w-[18px] text-center text-xs font-semibold text-slate-700">
                                {split.count}
                              </span>
                              <button
                                type="button"
                                onClick={handleComingSoon}
                                className="h-6 w-6 rounded-full border border-slate-200 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Card>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Kanäle
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {channelOptions.map((option) => {
                    const active = selectedChannels.includes(option.id);
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleChannel(option.id)}
                        className={`flex h-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                          active
                            ? "border-slate-900 bg-slate-50 text-slate-900"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                        aria-pressed={active}
                      >
                        <span
                          className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full border ${
                            active
                              ? "border-slate-900 bg-white text-slate-900"
                              : "border-slate-200 bg-white text-slate-400"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-semibold">
                            {option.title}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {option.description}
                          </span>
                          <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500">
                            {option.hint}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Onboarding-Profil
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Lege fest, welche Daten deine Sänger:innen bei der Anmeldung
                  eingeben. Pflichtfelder sind markiert.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {profileFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                    >
                      <span>{field.label}</span>
                      {field.required ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                          <Check className="h-3 w-3" />
                          Pflicht
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Optional</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      Einladungslink
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Link teilen oder direkt versenden, damit Sänger:innen sich
                      selbst eintragen.
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      selectedChannels.includes("link")
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    {selectedChannels.includes("link")
                      ? "Aktiv"
                      : "Deaktiviert"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3">
                  <span className="text-sm text-slate-700">
                    {inviteLink || "Link wird erstellt..."}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    disabled={!inviteLink}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-slate-300 disabled:opacity-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Kopiert" : "Kopieren"}
                  </button>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      Direkte Einladungen
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Trage einzelne Kontakte ein – ideal für Solisten oder
                      Referenzen.
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      selectedChannels.includes("email")
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    {selectedChannels.includes("email")
                      ? "Aktiv"
                      : "Deaktiviert"}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {inviteRows.map((row) => (
                    <div
                      key={row.id}
                      className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1.3fr_1.6fr_0.8fr]"
                    >
                      <input
                        value={row.name}
                        onChange={(event) =>
                          updateInviteRow(row.id, "name", event.target.value)
                        }
                        placeholder="Name"
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      />
                      <input
                        value={row.email}
                        onChange={(event) =>
                          updateInviteRow(row.id, "email", event.target.value)
                        }
                        placeholder="E-Mail"
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      />
                      <select
                        value={row.voice}
                        onChange={(event) =>
                          updateInviteRow(row.id, "voice", event.target.value)
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/60"
                      >
                        <option value="">Stimme</option>
                        {voiceOrder.map((voice) => (
                          <option key={voice} value={voice}>
                            {getVoiceLabel(voice)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addInviteRow}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-slate-300"
                  >
                    + Weitere Einladung
                  </button>
                </div>
              </Card>

              <Card>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Einladungstext
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Der Text wird in der E-Mail und auf der Landingpage angezeigt.
                </p>
                <textarea
                  value={inviteMessage}
                  onChange={(event) => setInviteMessage(event.target.value)}
                  rows={4}
                  className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                />
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-600">
                  <div className="text-xs uppercase text-slate-400">
                    Vorschau
                  </div>
                  <p className="mt-2 whitespace-pre-wrap">{inviteMessage}</p>
                </div>
              </Card>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Card>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Überblick
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs text-slate-400">Ensemble</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedChoir?.name ?? "—"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {selectedChoir?.city}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs text-slate-400">Projekt</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedProject?.name ?? "—"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {selectedProject
                        ? formatDateRange(
                            selectedProject.date_range.start,
                            selectedProject.date_range.end
                          )
                        : "—"}
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs uppercase text-slate-400">
                    Kanäle
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeChannels.length > 0 ? (
                      activeChannels.map((channel) => (
                        <Badge key={channel.id}>{channel.title}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">
                        Keine Kanäle ausgewählt.
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs uppercase text-slate-400">
                    Einladungen
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {filledInvites.length} direkte Einladungen vorbereitet
                  </div>
                </div>
              </Card>

              <Card>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Nächste Schritte
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-400" />
                    Einladungslink teilen oder in Newsletter einsetzen
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-400" />
                    Direkte Einladungen absenden
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-400" />
                    Rückmeldungen im Projekt-Board verfolgen
                  </li>
                </ul>
                {commitStats ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    {commitStats.createdPersons} neue Personen,{" "}
                    {commitStats.upsertedMemberships} Memberships,{" "}
                    {commitStats.upsertedParticipants} Projektteilnahmen gespeichert.
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCommit()}
                    disabled={submitting}
                    className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                  >
                    {submitting ? "Speichert..." : "Onboarding starten"}
                  </button>
                  <Link
                    href="/singers"
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
                  >
                    Zur Personenübersicht
                  </Link>
                </div>
              </Card>
            </>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300"
              disabled={step === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Zurück
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm text-white"
              disabled={step === stepLabels.length - 1}
            >
              Weiter
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="bg-slate-50/70">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Zusammenfassung
            </div>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Ensemble</span>
                <span className="font-medium text-slate-900">
                  {selectedChoir?.name ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Projekt</span>
                <span className="font-medium text-slate-900">
                  {selectedProject?.name ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Kanäle</span>
                <span className="font-medium text-slate-900">
                  {activeChannels.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Einladungen</span>
                <span className="font-medium text-slate-900">
                  {filledInvites.length}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Stimmziele
            </div>
            <div className="mt-3 space-y-2">
              {voiceOrder.map((voice) => (
                <div
                  key={voice}
                  className="flex items-center justify-between text-sm text-slate-600"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: voiceColors[voice] }}
                    />
                    {getVoiceLabel(voice)}
                  </span>
                  <span className="font-medium text-slate-900">
                    {voiceSplitDefaults.reduce((sum, split) => sum + split.count, 0)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Hinweis
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Diese Ansicht nutzt Mock-Daten. Später können Einladungen
              gespeichert, verschickt und ausgewertet werden.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
