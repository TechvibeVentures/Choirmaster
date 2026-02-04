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

const getVoiceAreaStyle = (voice: Voice) => ({
  backgroundColor: `color-mix(in srgb, ${voiceBorderColors[voice]} 18%, white)`
});

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

export default function PeoplePage() {
  const [view, setView] = useState<"list" | "seating">("list");
  const currentProjectId = useMemo(() => getCurrentProjectId(), []);
  const handleComingSoon = () => {
    alert("Diese Funktion kommt in einer späteren Version der App.");
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

  const activeMembers = useMemo(() => {
    return people.filter((person) => {
      const membership = getMembership(person.id, defaultChoirId);
      return membership?.singer_status === "active";
    });
  }, []);

  const passiveMembers = useMemo(() => {
    return people.filter((person) => {
      const membership = getMembership(person.id, defaultChoirId);
      return membership && membership.singer_status !== "active";
    });
  }, []);

  const activeByVoice = useMemo(() => {
    const result = new Map<Voice, typeof people>();
    voiceOrder.forEach((voice) => result.set(voice, []));
    activeMembers.forEach((person) => {
      const membership = getMembership(person.id, defaultChoirId);
      if (!membership) return;
      result.get(membership.voice)?.push(person);
    });
    return result;
  }, [activeMembers]);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setView("seating")}
          className={`rounded-full border px-3 py-1 text-xs transition ${
            view === "seating"
              ? "border-slate-300 bg-slate-100 text-slate-900"
              : "border-slate-200 bg-white text-slate-500"
          }`}
        >
          Aufstellung
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-full border px-3 py-1 text-xs transition ${
            view === "list"
              ? "border-slate-300 bg-slate-100 text-slate-900"
              : "border-slate-200 bg-white text-slate-500"
          }`}
        >
          Liste
        </button>
      </div>

      {view === "list" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {voiceOrder.map((voice) => {
            const group = grouped.get(voice) ?? [];
            return (
              <section key={voice} className="flex flex-col gap-3">
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
                  {[...group]
                    .sort((a, b) => {
                      const aActive = confirmedIds.has(a.id);
                      const bActive = confirmedIds.has(b.id);
                      if (aActive === bActive) return 0;
                      return aActive ? -1 : 1;
                    })
                    .map((person) => {
                    const experienceTag = experienceLabels[person.experience_level];
                    const attendance = attendanceByPerson.get(person.id);
                    const statusLabel = confirmedIds.has(person.id)
                      ? "aktiv"
                      : "passiv";
                    return (
                      <Link key={person.id} href={`/people/${person.id}`}>
                        <Card
                          className="border-l-4 transition hover:border-slate-300"
                          style={{ borderLeftColor: voiceBorderColors[voice] }}
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
                                <span className="text-[10px] tracking-wide text-slate-400">
                                  {statusLabel}
                                </span>
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
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-6">
            <section className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs uppercase text-slate-400">
                Stimmaufteilung
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {voiceOrder.map((voice) => (
                  <div key={voice} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
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
            <div className="flex flex-col items-center gap-3">
              <div className="mt-4 text-xs uppercase text-slate-400">Leitung</div>
              <div className="flex flex-wrap justify-center gap-3">
                {conductors.map((person) => (
                  <Link
                    key={person.id}
                    href={`/people/${person.id}`}
                    className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 shadow-sm"
                  >
                    {getInitials(getPersonName(person))}
                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100">
                      {getPersonName(person)} · Leitung
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="w-full">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {voiceOrder.map((voice) => {
                  const members = activeByVoice.get(voice) ?? [];
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
                      <div className="space-y-3">
                        {voiceSplitDefaults.map((split) => {
                          const slice = members.slice(
                            splitIndex,
                            splitIndex + split.count
                          );
                          splitIndex += split.count;
                          return (
                            <div
                              key={`${voice}-${split.label}`}
                              className="rounded-2xl border border-slate-200 p-3"
                              style={getVoiceAreaStyle(voice)}
                            >
                              <div className="text-xs font-semibold text-slate-600">
                                {getVoiceLabel(voice)} {split.label}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {slice.map((person) => (
                                  <Link
                                    key={person.id}
                                    href={`/people/${person.id}`}
                                    className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-medium text-slate-700 shadow-sm"
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
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2">
              {passiveMembers.map((person) => (
                <Link
                  key={person.id}
                  href={`/people/${person.id}`}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-medium text-slate-600 shadow-sm"
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
