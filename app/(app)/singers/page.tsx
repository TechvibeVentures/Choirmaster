"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import {
  availability,
  defaultChoirId,
  getMembership,
  getPersonName,
  people,
  projectParticipations,
  projects,
  rehearsalsByProject,
  type Voice
} from "@/lib/mockData";
import { strings } from "@/lib/i18n";
import { getVoiceLabel } from "@/lib/labels";

const experienceLabels: Record<string, string> = {
  junior: "Einsteiger",
  regular: "Erfahren",
  advanced: "Fortgeschritten",
  professional: "Professionell"
};

const voiceOrder: Voice[] = ["Soprano", "Alto", "Tenor", "Bass"];

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getDisplayName = (firstName: string, lastName: string) => {
  const full = `${firstName} ${lastName}`.trim();
  if (full.length <= 22) return full;
  const shortened = `${firstName} ${lastName[0]}.`.trim();
  if (shortened.length <= 22) return shortened;
  return `${firstName[0]}. ${lastName}`.trim();
};

const voiceBorderColors: Record<Voice, string> = {
  Soprano: "var(--voice-soprano)",
  Alto: "var(--voice-alto)",
  Tenor: "var(--voice-tenor)",
  Bass: "var(--voice-bass)"
};

const voiceSplitDefaults = [
  { label: "1", count: 4 },
  { label: "2", count: 4 },
  { label: "3", count: 0 }
];

const getCurrentProjectId = () => {
  const today = new Date();
  const sorted = [...projects].sort(
    (a, b) =>
      new Date(`${a.date_range.start}T00:00:00`).getTime() -
      new Date(`${b.date_range.start}T00:00:00`).getTime()
  );

  const active = sorted.find(
    (project) =>
      new Date(`${project.date_range.end}T00:00:00`) >= today
  );

  return active?.id ?? sorted[0]?.id ?? "";
};

const getAttendanceClass = (value: number | null) => {
  if (value === null) {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }
  if (value >= 75) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (value >= 50) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-rose-200 bg-rose-50 text-rose-700";
};

const getEvenSplitCounts = (total: number, parts: number) => {
  if (parts <= 0) return [];
  const base = Math.floor(total / parts);
  const remainder = total % parts;
  return Array.from({ length: parts }, (_, index) =>
    base + (index < remainder ? 1 : 0)
  );
};

const shiftTargetsLeftInTwoColumn = (
  items: typeof people,
  targetIds: string[]
) => {
  const targets = new Set(targetIds);
  let reordered = [...items];
  targetIds.forEach((targetId) => {
    const index = reordered.findIndex((person) => person.id === targetId);
    if (index <= 0 || index % 2 === 0) return;
    if (targets.has(reordered[index - 1]?.id)) return;
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;
  });
  return reordered;
};

export default function PeoplePage() {
  const [view, setView] = useState<"list" | "seating">("list");
  const [voiceSplitOpen, setVoiceSplitOpen] = useState(false);
  const currentProjectId = useMemo(() => getCurrentProjectId(), []);
  const handleComingSoon = () => {
    alert("Diese Funktion kommt in einer späteren Version der App.");
  };
  const handleRepositionInfo = () => {
    window.alert(
      "In einer späteren Version der App können die Positionen der Stimmen und Sänger per Drag- and Drop neu positioniert werden."
    );
  };

  const grouped = useMemo(() => {
    const result = new Map<Voice, typeof people>();
    voiceOrder.forEach((voice) => result.set(voice, []));
    people.forEach((person) => {
      const membership = getMembership(person.id, defaultChoirId);
      if (!membership) return;
      result.get(membership.voice)?.push(person);
    });
    return result;
  }, []);

  const confirmedIds = useMemo(
    () =>
      new Set(
        projectParticipations
          .filter(
            (item) =>
              item.project_id === currentProjectId &&
              item.invite_status === "confirmed"
          )
          .map((item) => item.person_id)
      ),
    [currentProjectId]
  );

  const projectRehearsalIds = useMemo(
    () =>
      (rehearsalsByProject[currentProjectId] ?? []).map((item) => item.id),
    [currentProjectId]
  );

  const attendanceByPerson = useMemo(() => {
    const map = new Map<string, { yes: number; total: number; percent: number } | null>();
    people.forEach((person) => {
      if (!confirmedIds.has(person.id)) {
        map.set(person.id, null);
        return;
      }
      if (projectRehearsalIds.length === 0) {
        map.set(person.id, null);
        return;
      }
      const records = availability.filter(
        (item) =>
          item.person_id === person.id &&
          projectRehearsalIds.includes(item.rehearsal_id)
      );
      if (records.length === 0) {
        map.set(person.id, null);
        return;
      }
      const yesCount = records.filter((item) => item.status === "yes").length;
      const percent = Math.round((yesCount / records.length) * 100);
      map.set(person.id, { yes: yesCount, total: records.length, percent });
    });
    return map;
  }, [confirmedIds, projectRehearsalIds]);

  const conductors = useMemo(
    () => people.filter((person) => person.roles.includes("conductor")),
    []
  );
  const conductorIds = useMemo(
    () => new Set(conductors.map((person) => person.id)),
    [conductors]
  );

  const projectActiveMembers = useMemo(() => {
    return people.filter((person) => {
      const membership = getMembership(person.id, defaultChoirId);
      return membership && confirmedIds.has(person.id) && !conductorIds.has(person.id);
    });
  }, [confirmedIds, conductorIds]);

  const projectPassiveMembers = useMemo(() => {
    return people.filter((person) => {
      const membership = getMembership(person.id, defaultChoirId);
      return membership && !confirmedIds.has(person.id) && !conductorIds.has(person.id);
    });
  }, [confirmedIds, conductorIds]);

  const activeByVoice = useMemo(() => {
    const result = new Map<Voice, typeof people>();
    voiceOrder.forEach((voice) => result.set(voice, []));
    projectActiveMembers.forEach((person) => {
      const membership = getMembership(person.id, defaultChoirId);
      if (!membership) return;
      result.get(membership.voice)?.push(person);
    });
    return result;
  }, [projectActiveMembers]);

  const passiveByVoice = useMemo(() => {
    const result = new Map<Voice, typeof people>();
    voiceOrder.forEach((voice) => result.set(voice, []));
    projectPassiveMembers.forEach((person) => {
      const membership = getMembership(person.id, defaultChoirId);
      if (!membership) return;
      result.get(membership.voice)?.push(person);
    });
    return result;
  }, [projectPassiveMembers]);

  const formerSingers = useMemo(() => {
    return people.filter((person) => {
      const membership = getMembership(person.id, defaultChoirId);
      return membership?.singer_status === "inactive";
    });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="order-2 flex items-center justify-between gap-3 sm:order-1 sm:justify-start">
            <button
              type="button"
              onClick={() => setVoiceSplitOpen((prev) => !prev)}
              className="flex w-full flex-1 items-center justify-between gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 sm:w-auto sm:flex-none"
            >
              Stimmaufteilung
              <span className="text-slate-400">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 12 8"
                  className={`h-3 w-3 transition ${
                    voiceSplitOpen ? "rotate-180" : "translate-y-px"
                  }`}
                >
                  <path
                    d="M1 1l5 5 5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            <span className="invisible whitespace-nowrap rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium shadow-sm sm:hidden">
              {strings.people.findSingers}
            </span>
          </div>
          <div className="order-1 flex items-center gap-3 sm:order-2">
            <div className="flex w-full flex-1 min-w-[140px] rounded-full border border-slate-200 bg-white p-0.5 sm:w-auto sm:flex-none">
              <button
                type="button"
                onClick={() => setView("seating")}
                className={`flex-1 rounded-full px-3 py-1 text-xs transition ${
                  view === "seating"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Aufstellung
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`flex-1 rounded-full px-3 py-1 text-xs transition ${
                  view === "list"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Details
              </button>
            </div>
            <Link
              href="/singers/onboarding"
              className="whitespace-nowrap rounded-xl border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 sm:hidden"
            >
              {strings.people.findSingers}
            </Link>
          </div>
        </div>
        <Link
          href="/singers/onboarding"
          className="hidden whitespace-nowrap rounded-xl border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 sm:inline-flex"
        >
          {strings.people.findSingers}
        </Link>
      </div>

      {view === "list" ? (
        <div className="space-y-6">
          {voiceSplitOpen ? (
            <section className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs uppercase text-slate-400">
                Stimmaufteilung
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
            </section>
          ) : null}
          <section>
            <div className="mb-3 text-xs uppercase text-slate-400">Leitung</div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {conductors.map((person) => {
                const attendance = attendanceByPerson.get(person.id) ?? null;
                return (
                  <Link key={person.id} href={`/singers/${person.id}`} className="block">
                    <Card
                      className="w-full border-l-4 transition hover:border-slate-300"
                      style={{
                        borderLeftColor:
                          voiceBorderColors[
                            getMembership(person.id, defaultChoirId)?.voice ?? "Bass"
                          ]
                      }}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="space-y-2">
                          <div className="flex items-baseline gap-2">
                            <h2
                              className="text-lg font-semibold text-slate-900"
                              title={getPersonName(person)}
                            >
                              {getDisplayName(person.first_name, person.last_name)}
                            </h2>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-slate-500">
                              {person.city}
                            </p>
                            <Badge className="text-slate-600">
                              {experienceLabels[person.experience_level]}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-xs ${getAttendanceClass(
                                attendance === null ? null : attendance.percent
                              )}`}
                            >
                              {attendance === null ? "–" : `${attendance.percent}%`}
                            </span>
                            <span>
                              Anwesenheit:{" "}
                              <span className="font-semibold text-slate-700">
                                {attendance === null
                                  ? "–"
                                  : `${attendance.yes}/${attendance.total} Proben`}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3 text-xs uppercase text-slate-400">
              Aktive Sänger
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {voiceOrder.map((voice) => {
                const group = (grouped.get(voice) ?? []).filter(
                  (person) =>
                    confirmedIds.has(person.id) && !conductorIds.has(person.id)
                );
                const targetSeats = voiceSplitDefaults.reduce(
                  (sum, split) => sum + split.count,
                  0
                );
                const emptySeats = Math.max(0, targetSeats - group.length);
                return (
                  <section key={`active-${voice}`} className="flex flex-col gap-3">
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
                          Noch keine Stimmen eingetragen
                        </div>
                      ) : null}
                      {group.map((person) => {
                        const experienceTag = experienceLabels[person.experience_level];
                        const attendance = attendanceByPerson.get(person.id) ?? null;
                        return (
                          <Link key={person.id} href={`/singers/${person.id}`} className="block">
                            <Card
                              className="w-full border-l-4 transition hover:border-slate-300"
                              style={{ borderLeftColor: voiceBorderColors[voice] }}
                            >
                              <div className="flex flex-col gap-3">
                                <div className="space-y-2">
                                  <div className="flex items-baseline gap-2">
                                    <h2
                                      className="text-lg font-semibold text-slate-900"
                                      title={getPersonName(person)}
                                    >
                                      {getDisplayName(
                                        person.first_name,
                                        person.last_name
                                      )}
                                    </h2>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-slate-500">
                                      {person.city}
                                    </p>
                                    <Badge className="text-slate-600">
                                      {experienceTag}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                    <span
                                      className={`inline-flex rounded-full border px-2 py-1 text-xs ${getAttendanceClass(
                                        attendance === null ? null : attendance.percent
                                      )}`}
                                    >
                                      {attendance === null
                                        ? "–"
                                        : `${attendance.percent}%`}
                                    </span>
                                    <span>
                                      Anwesenheit:{" "}
                                      <span className="font-semibold text-slate-700">
                                        {attendance === null
                                          ? "–"
                                          : `${attendance.yes}/${attendance.total} Proben`}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        );
                      })}
                      {Array.from({ length: emptySeats }).map((_, index) => (
                        <button
                          key={`${voice}-empty-${index}`}
                          type="button"
                          onClick={handleComingSoon}
                          className="w-full text-left"
                        >
                          <Card className="border-dashed border-slate-200 text-slate-400">
                            <div className="flex flex-col gap-3">
                              <div className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                  <h2 className="text-lg font-semibold text-slate-300">
                                    Platz frei
                                  </h2>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm text-slate-300">–</p>
                                  <Badge className="text-slate-300">
                                    {getVoiceLabel(voice)}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                                  <span className="inline-flex rounded-full border border-slate-200 px-2 py-1 text-xs">
                                    –%
                                  </span>
                                  <span>Anwesenheit: –</span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3 text-xs uppercase text-slate-400">
              Passive Sänger
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {voiceOrder.map((voice) => {
                const group = (grouped.get(voice) ?? []).filter(
                  (person) =>
                    !confirmedIds.has(person.id) &&
                    !conductorIds.has(person.id) &&
                    getMembership(person.id, defaultChoirId)?.singer_status !==
                      "inactive"
                );
                return (
                  <section key={`passive-${voice}`} className="flex flex-col gap-3">
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
                          Noch keine Stimmen eingetragen
                        </div>
                      ) : null}
                      {group.map((person) => {
                        const experienceTag = experienceLabels[person.experience_level];
                        return (
                          <Link key={person.id} href={`/singers/${person.id}`} className="block">
                            <Card
                              className="w-full border-l-4 transition hover:border-slate-300"
                              style={{ borderLeftColor: voiceBorderColors[voice] }}
                            >
                              <div className="flex flex-col gap-3">
                                <div className="space-y-2">
                                  <div className="flex items-baseline gap-2">
                                    <h2
                                      className="text-lg font-semibold text-slate-900"
                                      title={getPersonName(person)}
                                    >
                                      {getDisplayName(
                                        person.first_name,
                                        person.last_name
                                      )}
                                    </h2>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-slate-500">
                                      {person.city}
                                    </p>
                                    <Badge className="text-slate-600">
                                      {experienceTag}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3 text-xs uppercase text-slate-400">
              Ehemalige Sänger
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {voiceOrder.map((voice) => {
                const group = (grouped.get(voice) ?? []).filter(
                  (person) =>
                    !conductorIds.has(person.id) &&
                    getMembership(person.id, defaultChoirId)?.singer_status ===
                      "inactive"
                );
                return (
                  <section key={`former-${voice}`} className="flex flex-col gap-3">
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
                          Noch keine Stimmen eingetragen
                        </div>
                      ) : null}
                      {group.map((person) => {
                        return (
                          <Link key={person.id} href={`/singers/${person.id}`} className="block">
                            <Card
                              className="w-full border-l-4 transition hover:border-slate-300"
                              style={{ borderLeftColor: voiceBorderColors[voice] }}
                            >
                              <div className="flex flex-col gap-3">
                                <div className="space-y-2">
                                  <div className="flex items-baseline gap-2">
                                    <h2
                                      className="text-lg font-semibold text-slate-900"
                                      title={getPersonName(person)}
                                    >
                                      {getDisplayName(
                                        person.first_name,
                                        person.last_name
                                      )}
                                    </h2>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-slate-500">
                                      {person.city}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-6">
            {voiceSplitOpen ? (
              <section className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs uppercase text-slate-400">
                  Stimmaufteilung
                </div>
                <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {voiceOrder.map((voice) => (
                    <div
                      key={voice}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                    >
                      <button
                        type="button"
                        onClick={handleRepositionInfo}
                        className="relative z-10 flex items-center gap-2 text-left text-sm font-semibold text-slate-700 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: voiceBorderColors[voice] }}
                        />
                        <span>{getVoiceLabel(voice)}</span>
                      </button>
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
              </section>
            ) : null}

            <section className="flex w-full flex-col items-start gap-3">
              <div className="text-xs uppercase text-slate-400">Leitung</div>
              <div className="flex flex-wrap justify-start gap-3">
                {conductors.map((person) => (
                  <Link
                    key={person.id}
                    href={`/singers/${person.id}`}
                    className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 shadow-sm"
                    style={{
                      borderColor:
                        voiceBorderColors[
                          getMembership(person.id, defaultChoirId)?.voice ?? "Bass"
                        ]
                    }}
                  >
                    {getInitials(getPersonName(person))}
                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100">
                      {getPersonName(person)} · Leitung ·{" "}
                      {getVoiceLabel(
                        getMembership(person.id, defaultChoirId)?.voice ?? "Bass"
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <div className="w-full">
              <div className="mb-3 text-xs uppercase text-slate-400">
                Aktive Sänger
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {voiceOrder.map((voice) => {
                  const members = activeByVoice.get(voice) ?? [];
                  const splitCuts = voiceSplitDefaults.filter(
                    (split) => split.count > 0
                  );
                  const splitCounts = getEvenSplitCounts(
                    members.length,
                    splitCuts.length
                  );
                  let splitIndex = 0;
                  return (
                    <div key={voice} className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: voiceBorderColors[voice] }}
                        />
                        <span>{getVoiceLabel(voice)}</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {splitCuts.map((split, splitPosition) => {
                          const count = splitCounts[splitPosition] ?? 0;
                          const slice = members.slice(
                            splitIndex,
                            splitIndex + count
                          );
                          splitIndex += count;
                          const missingSeats = Math.max(0, split.count - slice.length);
                          return (
                            <div key={`${voice}-${split.label}`}>
                              <div className="text-xs font-normal text-slate-400 text-center">
                                {getVoiceLabel(voice)} {split.label}
                              </div>
                              <div className="mt-1 h-px w-full bg-slate-200" />
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {slice.map((person) => (
                                  <Link
                                    key={person.id}
                                    href={`/singers/${person.id}`}
                                    className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-medium text-slate-700 shadow-sm"
                                    style={{ borderColor: voiceBorderColors[voice] }}
                                  >
                                    {getInitials(getPersonName(person))}
                                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100">
                                      {getPersonName(person)} · {getVoiceLabel(voice)}
                                    </span>
                                  </Link>
                                ))}
                                {Array.from({ length: missingSeats }).map((_, index) => (
                                  <button
                                    key={`${voice}-${split.label}-empty-${index}`}
                                    type="button"
                                    onClick={handleComingSoon}
                                    className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50 text-[9px] text-slate-300 transition hover:border-slate-300 hover:text-slate-400"
                                  >
                                    frei
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <section>
            <div className="mb-3 text-xs uppercase text-slate-400">
              Passive Sänger
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {voiceOrder.map((voice) => {
                const members = passiveByVoice.get(voice) ?? [];
                const orderedMembers =
                  voice === "Tenor"
                    ? shiftTargetsLeftInTwoColumn(members, [
                        "benjamin-zwicky",
                        "adrian-lutz"
                      ])
                    : members;
                return (
                  <div key={voice}>
                    <div className="grid grid-cols-2 gap-2">
                      {orderedMembers.map((person) => (
                        <Link
                          key={person.id}
                          href={`/singers/${person.id}`}
                          className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-medium text-slate-600 shadow-sm"
                          style={{ borderColor: voiceBorderColors[voice] }}
                        >
                          {getInitials(getPersonName(person))}
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100">
                              {getPersonName(person)} · {getVoiceLabel(voice)}
                            </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3 text-xs uppercase text-slate-400">
              Ehemalige Sänger
            </div>
            <div className="flex flex-wrap gap-2">
              {formerSingers.map((person) => (
                <Link
                  key={person.id}
                  href={`/singers/${person.id}`}
                  className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-medium text-slate-500 shadow-sm"
                >
                  {getInitials(getPersonName(person))}
                  <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100">
                    {getPersonName(person)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
