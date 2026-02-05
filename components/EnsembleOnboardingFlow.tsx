"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles
} from "lucide-react";
import Card from "@/components/Card";
import { strings } from "@/lib/i18n";
import type { Voice, Weekday } from "@/lib/mockData";
import { getVoiceLabel } from "@/lib/labels";

type Props = {
  open: boolean;
  onClose: () => void;
};

type ChoirType = "mixed" | "chamber" | "project";

const steps = [
  strings.ensembleOnboarding.stepBasics,
  strings.ensembleOnboarding.stepRehearsal,
  strings.ensembleOnboarding.stepVoices,
  strings.ensembleOnboarding.stepProject,
  strings.ensembleOnboarding.stepSingers,
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

const voiceBorderColors: Record<Voice, string> = {
  Soprano: "var(--voice-soprano)",
  Alto: "var(--voice-alto)",
  Tenor: "var(--voice-tenor)",
  Bass: "var(--voice-bass)"
};

const voiceOrder: Voice[] = ["Soprano", "Alto", "Tenor", "Bass"];

const voiceSplitDefaults = [
  { label: "1", count: 4 },
  { label: "2", count: 4 },
  { label: "3", count: 0 }
];

const singerFilters = [
  "Zürich",
  "Winterthur",
  "Erfahren",
  "Fortgeschritten",
  "Sopran",
  "Alt",
  "Tenor",
  "Bass"
];

const mockSingerResults = [
  { id: "s-1", name: "Mara König", email: "mara.koenig@example.com", voice: "Sopran" },
  { id: "s-2", name: "Noah Keller", email: "noah.keller@example.com", voice: "Tenor" },
  { id: "s-3", name: "Lina Frei", email: "lina.frei@example.com", voice: "Alt" },
  { id: "s-4", name: "Jonas Graf", email: "jonas.graf@example.com", voice: "Bass" }
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
  const [projectName, setProjectName] = useState("Frühlingskonzert 2026");
  const [projectStart, setProjectStart] = useState("2026-04-10");
  const [projectEnd, setProjectEnd] = useState("2026-06-12");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectSkipped, setProjectSkipped] = useState(false);
  const [activeSingerFilters, setActiveSingerFilters] = useState<string[]>([
    "Zürich",
    "Sopran"
  ]);
  const [selectedSingerIds, setSelectedSingerIds] = useState<string[]>([]);
  const [directEntries, setDirectEntries] = useState([
    { id: "entry-1", first: "Lea", last: "Suter", email: "lea.suter@example.com", voice: "Sopran" }
  ]);

  useEffect(() => {
    if (!open) {
      setStep(0);
    }
  }, [open]);

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

  const handleNext = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 0));
  const handleComingSoon = () => {
    window.alert("Diese Funktion kommt in einer späteren Version der App.");
  };

  const toggleSingerFilter = (value: string) => {
    setActiveSingerFilters((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const toggleSingerSelection = (id: string) => {
    setSelectedSingerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const addDirectEntry = () => {
    setDirectEntries((prev) => [
      ...prev,
      { id: `entry-${prev.length + 1}`, first: "", last: "", email: "", voice: "" }
    ]);
  };

  const updateDirectEntry = (id: string, key: "first" | "last" | "email" | "voice", value: string) => {
    setDirectEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [key]: value } : entry))
    );
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

        <div className="mt-4 flex flex-1 flex-col gap-4">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              {steps.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-left text-xs font-medium transition sm:text-sm ${
                    step === index
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800"
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
                      {strings.ensembleOnboarding.voiceTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {strings.ensembleOnboarding.voiceSubtitle}
                    </p>
                  </div>
                  <Sparkles className="h-5 w-5 text-slate-300" />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {voiceOrder.map((voice) => (
                    <div
                      key={voice}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: voiceBorderColors[voice] }}
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
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {strings.ensembleOnboarding.voiceHint}
                </div>
              </Card>
            ) : null}

            {step === 3 ? (
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {strings.ensembleOnboarding.projectTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {strings.ensembleOnboarding.projectSubtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProjectSkipped(true);
                        handleNext();
                      }}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                    >
                      {strings.ensembleOnboarding.projectSkip}
                    </button>
                    <CalendarDays className="h-5 w-5 text-slate-300" />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-slate-600 sm:col-span-2">
                    {strings.ensembleOnboarding.projectName}
                    <input
                      value={projectName}
                      onChange={(event) => {
                        setProjectName(event.target.value);
                        setProjectSkipped(false);
                      }}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none"
                    />
                  </label>
                  <label className="text-sm text-slate-600">
                    {strings.ensembleOnboarding.projectStart}
                    <input
                      value={projectStart}
                      onChange={(event) => {
                        setProjectStart(event.target.value);
                        setProjectSkipped(false);
                      }}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none"
                    />
                  </label>
                  <label className="text-sm text-slate-600">
                    {strings.ensembleOnboarding.projectEnd}
                    <input
                      value={projectEnd}
                      onChange={(event) => {
                        setProjectEnd(event.target.value);
                        setProjectSkipped(false);
                      }}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none"
                    />
                  </label>
                  <label className="text-sm text-slate-600 sm:col-span-2">
                    {strings.ensembleOnboarding.projectLocation}
                    <input
                      value={projectLocation}
                      onChange={(event) => {
                        setProjectLocation(event.target.value);
                        setProjectSkipped(false);
                      }}
                      placeholder={location}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none"
                    />
                  </label>
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {strings.ensembleOnboarding.projectHint}
                </div>
              </Card>
            ) : null}

            {step === 4 ? (
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {strings.ensembleOnboarding.singersTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {strings.ensembleOnboarding.singersSubtitle}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-800">
                      {strings.ensembleOnboarding.singersSearch}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {strings.ensembleOnboarding.singersSearchHint}
                    </p>
                    <div className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                      {strings.ensembleOnboarding.singersFilters}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {singerFilters.map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => toggleSingerFilter(filter)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            activeSingerFilters.includes(filter)
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 text-xs uppercase tracking-wide text-slate-400">
                      {strings.ensembleOnboarding.singersResults}
                    </div>
                    <div className="mt-2 space-y-2">
                      {mockSingerResults.map((singer) => (
                        <div
                          key={singer.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">
                              {singer.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {singer.email} · {singer.voice}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleSingerSelection(singer.id)}
                            className={`rounded-full border px-2 py-1 text-[11px] transition ${
                              selectedSingerIds.includes(singer.id)
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            {selectedSingerIds.includes(singer.id)
                              ? strings.ensembleOnboarding.singersAdded
                              : strings.ensembleOnboarding.singersAdd}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-800">
                      {strings.ensembleOnboarding.singersUpload}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {strings.ensembleOnboarding.singersUploadHint}
                    </p>
                    <button
                      type="button"
                      onClick={handleComingSoon}
                      className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-xs text-slate-500 transition hover:border-slate-300"
                    >
                      <span>{strings.ensembleOnboarding.singersUploadDrop}</span>
                      <span className="text-[11px] text-slate-400">
                        {strings.ensembleOnboarding.singersUploadFormat}
                      </span>
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-800">
                      {strings.ensembleOnboarding.singersDirect}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {strings.ensembleOnboarding.singersDirectHint}
                    </p>
                    <div className="mt-3 space-y-3">
                      {directEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600 sm:grid-cols-2"
                        >
                          <input
                            value={entry.first}
                            onChange={(event) => updateDirectEntry(entry.id, "first", event.target.value)}
                            placeholder="Vorname"
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700"
                          />
                          <input
                            value={entry.last}
                            onChange={(event) => updateDirectEntry(entry.id, "last", event.target.value)}
                            placeholder="Nachname"
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700"
                          />
                          <input
                            value={entry.email}
                            onChange={(event) => updateDirectEntry(entry.id, "email", event.target.value)}
                            placeholder="E-Mail"
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 sm:col-span-2"
                          />
                          <input
                            value={entry.voice}
                            onChange={(event) => updateDirectEntry(entry.id, "voice", event.target.value)}
                            placeholder="Stimme"
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 sm:col-span-2"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addDirectEntry}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 transition hover:border-slate-300"
                      >
                        {strings.ensembleOnboarding.singersEntryAdd}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            {step === 5 ? (
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
                      <li>
                        {strings.ensembleOnboarding.summaryGenres}: {genres.length ? genres.join(", ") : strings.ensembleOnboarding.summaryGenresEmpty}
                      </li>
                      <li>
                        {strings.ensembleOnboarding.singersSummary}: {selectedSingerIds.length + directEntries.length || strings.ensembleOnboarding.singersSummaryEmpty}
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-slate-200 px-4 py-4 text-sm">
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      {strings.ensembleOnboarding.projectSummary}
                    </div>
                    {projectSkipped ? (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        {strings.ensembleOnboarding.projectSkipped}
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div className="font-semibold text-slate-800">
                          {projectName || strings.ensembleOnboarding.projectNamePlaceholder}
                        </div>
                        <div>
                          {strings.ensembleOnboarding.projectDates}: {projectStart} – {projectEnd}
                        </div>
                        <div>
                          {strings.ensembleOnboarding.projectLocation}: {projectLocation || location}
                        </div>
                      </div>
                    )}
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
