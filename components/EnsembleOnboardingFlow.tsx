"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  MapPin,
  Sparkles,
  Users
} from "lucide-react";
import Card from "@/components/Card";
import { strings } from "@/lib/i18n";
import type { Voice, Weekday } from "@/lib/mockData";

type Props = {
  open: boolean;
  onClose: () => void;
};

type ChoirType = "mixed" | "chamber" | "project";

const steps = [
  strings.ensembleOnboarding.stepBasics,
  strings.ensembleOnboarding.stepRehearsal,
  strings.ensembleOnboarding.stepTeam,
  strings.ensembleOnboarding.stepFinish
];

const choirTypes: { id: ChoirType; label: string; description: string }[] = [
  {
    id: "mixed",
    label: "Gemischter Chor",
    description: "SATB-Aufstellung mit flexibler Besetzung"
  },
  {
    id: "chamber",
    label: "Kammerchor",
    description: "Kleinere Besetzung mit Fokus auf Detailarbeit"
  },
  {
    id: "project",
    label: "Projektchor",
    description: "Zeitlich begrenzte Produktion, wechselnde Stimmen"
  }
];

const genreOptions = [
  "Klassik",
  "Romantik",
  "Geistlich",
  "Zeitgenössisch",
  "Crossover",
  "Volkslied"
];

const weekdayOptions: { id: Weekday; label: string }[] = [
  { id: "Mon", label: "Mo" },
  { id: "Tue", label: "Di" },
  { id: "Wed", label: "Mi" },
  { id: "Thu", label: "Do" },
  { id: "Fri", label: "Fr" },
  { id: "Sat", label: "Sa" },
  { id: "Sun", label: "So" }
];

const voiceColors: Record<Voice, string> = {
  Soprano: "var(--voice-soprano)",
  Alto: "var(--voice-alto)",
  Tenor: "var(--voice-tenor)",
  Bass: "var(--voice-bass)"
};

const voiceGroups: { id: Voice; label: string; target: string }[] = [
  { id: "Soprano", label: "Sopran", target: "8-10" },
  { id: "Alto", label: "Alt", target: "6-8" },
  { id: "Tenor", label: "Tenor", target: "4-6" },
  { id: "Bass", label: "Bass", target: "4-6" }
];

const roleOptions = [
  {
    id: "conductor",
    label: "Leitung",
    description: "Dirigat & musikalische Verantwortung"
  },
  {
    id: "chairman",
    label: "Vorstand",
    description: "Organisation, Kommunikation, Finanzen"
  },
  {
    id: "section",
    label: "Stimmführer",
    description: "Ansprechpersonen pro Stimmgruppe"
  }
];

export default function EnsembleOnboardingFlow({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Luzia Chor");
  const [city, setCity] = useState("Zürich");
  const [choirType, setChoirType] = useState<ChoirType>("mixed");
  const [genres, setGenres] = useState<string[]>([
    "Klassik",
    "Geistlich"
  ]);
  const [weekdays, setWeekdays] = useState<Weekday[]>(["Tue"]);
  const [startTime, setStartTime] = useState("19:30");
  const [endTime, setEndTime] = useState("21:30");
  const [location, setLocation] = useState("Pfrundhaus, Zürich");
  const [roles, setRoles] = useState<string[]>(["conductor", "chairman"]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(0);
    }
  }, [open]);

  const inviteLink = useMemo(
    () => `choirmaster.app/chor/${name.toLowerCase().replace(/\s+/g, "-")}/join`,
    [name]
  );

  if (!open) return null;

  const toggleGenre = (genre: string) => {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((item) => item !== genre) : [...prev, genre]
    );
  };

  const toggleWeekday = (day: Weekday) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
    );
  };

  const toggleRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]
    );
  };

  const handleNext = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 0));

  const handleCopy = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-white/75 backdrop-blur-sm" />
      <div className="relative mx-auto flex h-full max-w-5xl flex-col px-4 py-6 sm:px-6 md:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-lg sm:px-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              {strings.ensembleOnboarding.subtitle}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">
              {strings.ensembleOnboarding.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {strings.ensembleOnboarding.lede}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
              Schritt {step + 1} von {steps.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            >
              {strings.ensembleOnboarding.close}
            </button>
          </div>
        </div>

        <div className="mt-4 grid flex-1 gap-4 md:grid-cols-[220px_1fr]">
          <Card className="h-fit">
            <div className="space-y-3">
              {steps.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                    step === index
                      ? "bg-slate-900 text-white"
                      : "border border-transparent text-slate-600 hover:border-slate-200 hover:text-slate-800"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      step === index
                        ? "bg-white text-slate-900"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            {step === 0 ? (
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {strings.ensembleOnboarding.basicsTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {strings.ensembleOnboarding.basicsSubtitle}
                    </p>
                  </div>
                  <Sparkles className="h-5 w-5 text-slate-300" />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-slate-600">
                    {strings.ensembleOnboarding.name}
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none"
                    />
                  </label>
                  <label className="text-sm text-slate-600">
                    {strings.ensembleOnboarding.city}
                    <input
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none"
                    />
                  </label>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-slate-600">
                    {strings.ensembleOnboarding.type}
                  </div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {choirTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setChoirType(type.id)}
                        className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                          choirType === type.id
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <div className="font-semibold">{type.label}</div>
                        <div className="mt-1 text-xs opacity-80">
                          {type.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-slate-600">
                    {strings.ensembleOnboarding.genres}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {genreOptions.map((genre) => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          genres.includes(genre)
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            ) : null}

            {step === 1 ? (
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {strings.ensembleOnboarding.rehearsalTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {strings.ensembleOnboarding.rehearsalSubtitle}
                    </p>
                  </div>
                  <MapPin className="h-5 w-5 text-slate-300" />
                </div>
                <div className="mt-4">
                  <div className="text-sm text-slate-600">
                    {strings.ensembleOnboarding.weekdays}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {weekdayOptions.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleWeekday(day.id)}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          weekdays.includes(day.id)
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <label className="text-sm text-slate-600">
                    {strings.ensembleOnboarding.start}
                    <input
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none"
                    />
                  </label>
                  <label className="text-sm text-slate-600">
                    {strings.ensembleOnboarding.end}
                    <input
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none"
                    />
                  </label>
                  <label className="text-sm text-slate-600">
                    {strings.ensembleOnboarding.location}
                    <input
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none"
                    />
                  </label>
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {strings.ensembleOnboarding.rehearsalHint}
                </div>
              </Card>
            ) : null}

            {step === 2 ? (
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {strings.ensembleOnboarding.teamTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {strings.ensembleOnboarding.teamSubtitle}
                    </p>
                  </div>
                  <Users className="h-5 w-5 text-slate-300" />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {roleOptions.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRole(role.id)}
                      className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                        roles.includes(role.id)
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-semibold">{role.label}</div>
                      <div className="mt-1 text-xs opacity-80">
                        {role.description}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-5">
                  <div className="text-sm text-slate-600">
                    {strings.ensembleOnboarding.voiceTargets}
                  </div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {voiceGroups.map((voice) => (
                      <div
                        key={voice.id}
                        className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            {voice.label}
                          </span>
                          <span
                            className="h-3 w-8 rounded-full"
                            style={{ backgroundColor: voiceColors[voice.id] }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Zielbesetzung: {voice.target} Stimmen
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : null}

            {step === 3 ? (
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {strings.ensembleOnboarding.finishTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {strings.ensembleOnboarding.finishSubtitle}
                    </p>
                  </div>
                  <Check className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 px-4 py-4 text-sm">
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      {strings.ensembleOnboarding.preview}
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-900">
                      {name}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{city}</div>
                    <div className="mt-3 text-xs text-slate-500">
                      {strings.ensembleOnboarding.summaryLabel}
                    </div>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      <li>
                        {strings.ensembleOnboarding.summaryType}: {choirTypes.find((type) => type.id === choirType)?.label}
                      </li>
                      <li>
                        {strings.ensembleOnboarding.summaryRehearsal}: {weekdays.map((day) => weekdayOptions.find((item) => item.id === day)?.label).join(", ")}
                        , {startTime} – {endTime}
                      </li>
                      <li>
                        {strings.ensembleOnboarding.summaryLocation}: {location}
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-slate-200 px-4 py-4 text-sm">
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      {strings.ensembleOnboarding.share}
                    </div>
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      <span className="truncate">{inviteLink}</span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="ml-auto inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500"
                      >
                        <Copy className="h-3 w-3" />
                        {copied ? strings.ensembleOnboarding.copied : strings.ensembleOnboarding.copy}
                      </button>
                    </div>
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      {strings.ensembleOnboarding.shareHint}
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
                {strings.ensembleOnboarding.prev}
              </button>
              <button
                type="button"
                onClick={step === steps.length - 1 ? onClose : handleNext}
                className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-5 py-2 text-sm text-white transition hover:bg-slate-800"
              >
                {step === steps.length - 1
                  ? strings.ensembleOnboarding.finishAction
                  : strings.ensembleOnboarding.next}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
