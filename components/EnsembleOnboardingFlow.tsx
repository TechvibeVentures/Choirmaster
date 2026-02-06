"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Mail,
  MapPin,
  MessageCircle,
  Plus,
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
  strings.ensembleOnboarding.stepSingers,
  strings.ensembleOnboarding.stepIntegrations,
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

const voiceOptions = ["Sopran", "Alt", "Tenor", "Bass"];

const experienceOptions = [
  { id: "junior", label: "Einsteiger" },
  { id: "advanced", label: "Fortgeschritten" },
  { id: "regular", label: "Erfahren" },
  { id: "professional", label: "Professionell" }
];

const experienceLabels = experienceOptions.reduce<Record<string, string>>(
  (acc, item) => {
    acc[item.id] = item.label;
    return acc;
  },
  {}
);

const mockSingerResults: {
  id: string;
  name: string;
  email: string;
  voice: Voice;
  city: string;
  experience: keyof typeof experienceLabels;
}[] = [
  {
    id: "s-1",
    name: "Mara König",
    email: "mara.koenig@example.com",
    voice: "Soprano",
    city: "Zürich",
    experience: "advanced"
  },
  {
    id: "s-2",
    name: "Noah Keller",
    email: "noah.keller@example.com",
    voice: "Tenor",
    city: "Winterthur",
    experience: "regular"
  },
  {
    id: "s-3",
    name: "Lina Frei",
    email: "lina.frei@example.com",
    voice: "Alto",
    city: "Baden",
    experience: "junior"
  },
  {
    id: "s-4",
    name: "Jonas Graf",
    email: "jonas.graf@example.com",
    voice: "Bass",
    city: "Uster",
    experience: "professional"
  },
  {
    id: "s-5",
    name: "Selina Roth",
    email: "selina.roth@example.com",
    voice: "Soprano",
    city: "Zürich",
    experience: "regular"
  },
  {
    id: "s-6",
    name: "Nico Meier",
    email: "nico.meier@example.com",
    voice: "Tenor",
    city: "Baden",
    experience: "advanced"
  },
  {
    id: "s-7",
    name: "Luisa Kern",
    email: "luisa.kern@example.com",
    voice: "Alto",
    city: "Winterthur",
    experience: "professional"
  },
  {
    id: "s-8",
    name: "David Frei",
    email: "david.frei@example.com",
    voice: "Bass",
    city: "Zürich",
    experience: "regular"
  },
  {
    id: "s-9",
    name: "Eva Keller",
    email: "eva.keller@example.com",
    voice: "Soprano",
    city: "Uster",
    experience: "junior"
  },
  {
    id: "s-10",
    name: "Mira Vogt",
    email: "mira.vogt@example.com",
    voice: "Alto",
    city: "St. Gallen",
    experience: "advanced"
  },
  {
    id: "s-11",
    name: "Lars Müller",
    email: "lars.mueller@example.com",
    voice: "Tenor",
    city: "Zürich",
    experience: "professional"
  },
  {
    id: "s-12",
    name: "Simon Bucher",
    email: "simon.bucher@example.com",
    voice: "Bass",
    city: "Winterthur",
    experience: "junior"
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
  const [singerMode, setSingerMode] = useState<"search" | "upload" | "direct">(
    "search"
  );
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([
    "regular"
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

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

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

  const toggleExperience = (id: string) => {
    setSelectedExperiences((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredResults = useMemo(() => {
    const query = locationQuery.trim().toLowerCase();
    return mockSingerResults.filter((singer) => {
      const matchesLocation = query
        ? singer.city.toLowerCase().includes(query)
        : true;
      const matchesExperience = selectedExperiences.length
        ? selectedExperiences.includes(singer.experience)
        : true;
      return matchesLocation && matchesExperience;
    });
  }, [locationQuery, selectedExperiences]);

const resultsByVoice = useMemo(() => {
  const map = new Map<Voice, typeof mockSingerResults>();
  voiceOrder.forEach((voice) => map.set(voice, []));
  filteredResults.forEach((singer) => {
    map.get(singer.voice)?.push(singer);
  });
  return map;
}, [filteredResults]);

  const selectedCountsByVoice = useMemo(() => {
    const counts = new Map<Voice, number>();
    voiceOrder.forEach((voice) => counts.set(voice, 0));
    const selectedSet = new Set(selectedSingerIds);
    mockSingerResults.forEach((singer) => {
      if (!selectedSet.has(singer.id)) return;
      counts.set(singer.voice, (counts.get(singer.voice) ?? 0) + 1);
    });
    const mapDirectVoice = (value: string): Voice | null => {
      if (value === "Sopran") return "Soprano";
      if (value === "Alt") return "Alto";
      if (value === "Tenor") return "Tenor";
      if (value === "Bass") return "Bass";
      return null;
    };
    directEntries.forEach((entry) => {
      const voice = mapDirectVoice(entry.voice);
      if (!voice) return;
      counts.set(voice, (counts.get(voice) ?? 0) + 1);
    });
    return counts;
  }, [directEntries, selectedSingerIds]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-white/75 backdrop-blur-sm" />
      <div className="relative mx-auto flex h-full max-w-6xl flex-col px-4 py-6 sm:px-6 md:py-10">
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

        <div className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto pb-6">
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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {strings.ensembleOnboarding.singersTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {strings.ensembleOnboarding.singersSubtitle}
                    </p>
                  </div>
                  <div className="flex w-full flex-1 min-w-[200px] rounded-full border border-slate-200 bg-white p-0.5 sm:w-auto sm:flex-none">
                    {[
                      { id: "search", label: strings.ensembleOnboarding.singersSearch },
                      { id: "upload", label: strings.ensembleOnboarding.singersUpload },
                      { id: "direct", label: strings.ensembleOnboarding.singersDirect }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSingerMode(mode.id as "search" | "upload" | "direct")}
                        className={`flex-1 rounded-full px-3 py-1 text-xs transition ${
                          singerMode === mode.id
                            ? "bg-slate-900 text-white"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {singerMode === "search" ? (
                  <div className="mt-4 rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-800">
                      {strings.ensembleOnboarding.singersSearch}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {strings.ensembleOnboarding.singersSearchHint}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{strings.ensembleOnboarding.singersLocation}</span>
                        <input
                          value={locationQuery}
                          onChange={(event) => setLocationQuery(event.target.value)}
                          placeholder={strings.ensembleOnboarding.singersLocationPlaceholder}
                          className="w-56 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        />
                      </div>
                      <div className="flex flex-nowrap gap-2">
                        {experienceOptions.map((level) => (
                          <button
                            key={level.id}
                            type="button"
                            onClick={() => toggleExperience(level.id)}
                            className={`rounded-full border px-3 py-1 text-xs transition ${
                              selectedExperiences.includes(level.id)
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            {level.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 text-xs uppercase tracking-wide text-slate-400">
                      {strings.ensembleOnboarding.singersResults}
                    </div>
                    {filteredResults.length === 0 ? (
                      <div className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-xs text-slate-400">
                        {strings.ensembleOnboarding.singersEmpty}
                      </div>
                    ) : (
                      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {voiceOrder.map((voice) => {
                          const group = resultsByVoice.get(voice) ?? [];
                          return (
                            <section key={`search-${voice}`} className="flex flex-col gap-3">
                              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                                <span className="flex items-center gap-2">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: voiceBorderColors[voice] }}
                                  />
                                  <span>{getVoiceLabel(voice)}</span>
                                </span>
                                <span className="text-xs text-slate-400">
                                  {group.length}
                                </span>
                              </div>
                              <div className="flex flex-col gap-3">
                                {group.length === 0 ? (
                                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-xs text-slate-400">
                                    {strings.ensembleOnboarding.singersEmpty}
                                  </div>
                                ) : null}
                                {group.map((singer) => (
                                  <Link
                                    key={singer.id}
                                    href={`/singers/${singer.id}`}
                                    className="block"
                                  >
                                    <Card
                                      className="w-full border-l-4 transition hover:border-slate-300"
                                      style={{ borderLeftColor: voiceBorderColors[voice] }}
                                    >
                                      <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                          <div>
                                            <div className="text-base font-semibold text-slate-900">
                                              {singer.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                              {singer.email}
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={(event) => {
                                              event.preventDefault();
                                              event.stopPropagation();
                                              toggleSingerSelection(singer.id);
                                            }}
                                            aria-label={
                                              selectedSingerIds.includes(singer.id)
                                                ? strings.ensembleOnboarding.singersAdded
                                                : strings.ensembleOnboarding.singersAdd
                                            }
                                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-[11px] transition ${
                                              selectedSingerIds.includes(singer.id)
                                                ? "border-emerald-600 bg-emerald-600 text-white"
                                                : "border-slate-200 text-slate-500 hover:border-slate-300"
                                            }`}
                                          >
                                            {selectedSingerIds.includes(singer.id) ? (
                                              <Check className="h-3.5 w-3.5" />
                                            ) : (
                                              <Plus className="h-3 w-3" />
                                            )}
                                          </button>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                                          <span>{singer.city}</span>
                                          <span className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600">
                                            {experienceLabels[singer.experience]}
                                          </span>
                                        </div>
                                      </div>
                                    </Card>
                                  </Link>
                                ))}
                              </div>
                            </section>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}

                {singerMode === "upload" ? (
                  <div className="mt-4 rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-800">
                      {strings.ensembleOnboarding.singersUpload}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {strings.ensembleOnboarding.singersUploadHint}
                    </p>
                    <button
                      type="button"
                      onClick={handleComingSoon}
                      className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-xs text-slate-500 transition hover:border-slate-300"
                    >
                      <span>{strings.ensembleOnboarding.singersUploadDrop}</span>
                      <span className="text-[11px] text-slate-400">
                        {strings.ensembleOnboarding.singersUploadFormat}
                      </span>
                    </button>
                  </div>
                ) : null}

                {singerMode === "direct" ? (
                  <div className="mt-4 rounded-xl border border-slate-200 p-4">
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
                          className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600"
                        >
                          <input
                            value={entry.first}
                            onChange={(event) => updateDirectEntry(entry.id, "first", event.target.value)}
                            placeholder="Vorname"
                            className="min-w-[120px] flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                          />
                          <input
                            value={entry.last}
                            onChange={(event) => updateDirectEntry(entry.id, "last", event.target.value)}
                            placeholder="Nachname"
                            className="min-w-[120px] flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                          />
                          <input
                            value={entry.email}
                            onChange={(event) => updateDirectEntry(entry.id, "email", event.target.value)}
                            placeholder="E-Mail"
                            className="min-w-[220px] flex-[2] rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            {voiceOptions.map((voice) => {
                              const voiceKey = voice === "Sopran"
                                ? "Soprano"
                                : voice === "Alt"
                                  ? "Alto"
                                  : voice === "Tenor"
                                    ? "Tenor"
                                    : "Bass";
                              return (
                                <button
                                  key={voice}
                                  type="button"
                                  onClick={() => updateDirectEntry(entry.id, "voice", voice)}
                                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                                    entry.voice === voice
                                      ? "border-slate-900 bg-slate-900 text-white"
                                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                                  }`}
                                >
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: voiceBorderColors[voiceKey as Voice] }}
                                  />
                                  {voice}
                                </button>
                              );
                            })}
                          </div>
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
                ) : null}
              </Card>
            ) : null}

            {step === 4 ? (
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {strings.ensembleOnboarding.integrationsTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {strings.ensembleOnboarding.integrationsSubtitle}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      Nachrichten
                    </div>
                    <div className="mt-3 space-y-3">
                      {[
                        { label: strings.ensembleOnboarding.integrationEmail, icon: Mail },
                        { label: strings.ensembleOnboarding.integrationWhatsapp, icon: MessageCircle }
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 text-slate-400" />
                            <span>{item.label}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleComingSoon}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 hover:border-slate-300"
                          >
                            Verbinden
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      Dateiablage
                    </div>
                    <div className="mt-3 space-y-3">
                      {[
                        { label: strings.ensembleOnboarding.integrationGdrive, icon: Cloud },
                        { label: strings.ensembleOnboarding.integrationDropbox, icon: Cloud }
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 text-slate-400" />
                            <span>{item.label}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleComingSoon}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 hover:border-slate-300"
                          >
                            Verbinden
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      {strings.ensembleOnboarding.integrationsHint}
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
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 px-4 py-4 text-sm">
                      <div className="text-xs uppercase tracking-wide text-slate-400">
                        {strings.ensembleOnboarding.singersByVoiceTitle}
                      </div>
                      <div className="mt-3 space-y-2">
                        {voiceOrder.map((voice) => (
                          <div
                            key={`summary-${voice}`}
                            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm text-slate-600"
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: voiceBorderColors[voice] }}
                              />
                              {getVoiceLabel(voice)}
                            </span>
                            <span className="text-xs text-slate-400">
                              Ziel {voiceSplitDefaults.reduce((sum, split) => sum + split.count, 0)}
                            </span>
                            <span className="font-medium text-slate-900">
                              {selectedCountsByVoice.get(voice) ?? 0}
                            </span>
                          </div>
                        ))}
                      </div>
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
