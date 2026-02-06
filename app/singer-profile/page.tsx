"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import { formatDate, formatDateRange, formatTimeRange, formatWeekdays } from "@/lib/format";
import { strings } from "@/lib/i18n";
import { getVoiceLabel } from "@/lib/labels";
import {
  choirs,
  concertPrograms,
  concertsByProject,
  defaultChoirId,
  memberships,
  people,
  projectParticipations,
  projects,
  rehearsalsByProject,
  type Voice
} from "@/lib/mockData";

const voiceColors: Record<Voice, string> = {
  Soprano: "var(--voice-soprano)",
  Alto: "var(--voice-alto)",
  Tenor: "var(--voice-tenor)",
  Bass: "var(--voice-bass)"
};

const getCurrentProject = (choirId: string) => {
  const choirProjects = projects.filter((project) => project.choir_id === choirId);
  if (!choirProjects.length) {
    return null;
  }
  const sorted = [...choirProjects].sort(
    (a, b) =>
      new Date(`${a.date_range.start}T00:00:00`).getTime() -
      new Date(`${b.date_range.start}T00:00:00`).getTime()
  );
  const today = new Date();
  const active = sorted.find(
    (project) => new Date(`${project.date_range.end}T00:00:00`) >= today
  );
  return active ?? sorted[sorted.length - 1];
};

const experienceLabels: Record<
  "junior" | "regular" | "advanced" | "professional",
  string
> = {
  junior: "Einsteiger",
  regular: "Erfahren",
  advanced: "Fortgeschritten",
  professional: "Professionell"
};

const experienceKeys = Object.keys(experienceLabels) as Array<
  keyof typeof experienceLabels
>;

const singerStatusLabels: Record<string, string> = {
  active: "Aktiv",
  inactive: "Inaktiv",
  project_only: "Projektbezogen"
};

const inputStyles =
  "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none";

export default function SingerViewPage() {
  const mockSingerId = "nadia-frei";
  const singer = people.find((person) => person.id === mockSingerId) ?? people[0];
  const membership = memberships.find((item) => item.person_id === singer?.id);
  const membershipChoirs = memberships.filter((item) => item.person_id === singer?.id);
  const initialChoirId = membershipChoirs[0]?.choir_id ?? defaultChoirId;
  const [selectedChoirId, setSelectedChoirId] = useState(initialChoirId);
  const choir = choirs.find((entry) => entry.id === selectedChoirId) ?? choirs[0];
  const selectedMembership = membershipChoirs.find(
    (item) => item.choir_id === selectedChoirId
  );
  const project = getCurrentProject(selectedChoirId);
  const rehearsals = project ? rehearsalsByProject[project.id] ?? [] : [];
  const concerts = project ? concertsByProject[project.id] ?? [] : [];
  const sortedRehearsals = useMemo(
    () =>
      [...rehearsals].sort(
        (a, b) =>
          new Date(`${a.date}T00:00:00`).getTime() -
          new Date(`${b.date}T00:00:00`).getTime()
      ),
    [rehearsals]
  );
  const participation = project
    ? projectParticipations.find(
        (item) => item.project_id === project.id && item.person_id === singer?.id
      )
    : undefined;
  const program = project
    ? concertPrograms.find(
        (item) =>
          item.project_id === project.id && item.choir_id === selectedChoirId
      )
    : undefined;
  const voice = selectedMembership?.voice ?? membership?.voice;
  const [selectedExperience, setSelectedExperience] = useState(
    singer?.experience_level ?? "regular"
  );
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(voice ?? null);
  const [participationStatus, setParticipationStatus] = useState<
    "invited" | "confirmed" | "declined"
  >(participation?.invite_status ?? "invited");
  const [paymentStatus, setPaymentStatus] = useState<
    "unpaid" | "pending" | "confirmed"
  >("unpaid");
  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>(
    () =>
      sortedRehearsals.reduce<Record<string, boolean>>((acc, rehearsal) => {
        acc[rehearsal.id] = true;
        return acc;
      }, {})
  );

  const voiceOptions = useMemo(() => ["Soprano", "Alto", "Tenor", "Bass"] as Voice[], []);
  const voiceLabel = selectedVoice ? getVoiceLabel(selectedVoice) : "Stimme offen";
  const voiceColor = selectedVoice ? voiceColors[selectedVoice] : "#E2E8F0";

  useEffect(() => {
    setSelectedVoice(selectedMembership?.voice ?? voice ?? null);
    setParticipationStatus(participation?.invite_status ?? "invited");
    setPaymentStatus("unpaid");
    setAttendanceState(
      sortedRehearsals.reduce<Record<string, boolean>>((acc, rehearsal) => {
        acc[rehearsal.id] = true;
        return acc;
      }, {})
    );
  }, [
    selectedChoirId,
    selectedMembership?.voice,
    participation?.invite_status,
    sortedRehearsals,
    voice
  ]);

  const roleLabels = (singer?.roles ?? []).map((role) =>
    role === "chairman" ? "Vorstand" : role === "conductor" ? "Leitung" : "Sänger"
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {strings.singer.title}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
              {singer?.first_name} {singer?.last_name}
            </h1>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: voiceColor }}
            />
            <span>{voiceLabel}</span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-6">
            <Card className="h-fit">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-slate-900">
                  {strings.singer.profileTitle}
                </h2>
                <p className="text-sm text-slate-500">
                  {strings.singer.profileSubtitle}
                </p>
              </div>
              <form className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-slate-600">
                  {strings.singer.fields.firstName}
                  <input
                    className={inputStyles}
                    defaultValue={singer?.first_name}
                    type="text"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  {strings.singer.fields.lastName}
                  <input
                    className={inputStyles}
                    defaultValue={singer?.last_name}
                    type="text"
                  />
                </label>
                <label className="text-sm text-slate-600 sm:col-span-2">
                  {strings.singer.fields.email}
                  <input
                    className={inputStyles}
                    defaultValue={singer?.email}
                    type="email"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  {strings.singer.fields.phone}
                  <input
                    className={inputStyles}
                    defaultValue={singer?.phone ?? ""}
                    type="tel"
                    placeholder="+41 79 000 00 00"
                  />
                </label>
                <label className="text-sm text-slate-600">
                Ort
                <input
                  className={inputStyles}
                  defaultValue={singer?.city}
                  type="text"
                />
                </label>
                <div className="sm:col-span-2">
                  <p className="text-sm text-slate-600">
                    {strings.singer.fields.experience}
                  </p>
                  <div className="mt-2 flex flex-nowrap gap-1.5 overflow-x-auto">
                    {experienceKeys.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedExperience(key)}
                        className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium transition ${
                          selectedExperience === key
                            ? "border-slate-400 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <span className="sm:hidden">
                          {key === "advanced"
                            ? "Fortgeschr."
                            : key === "professional"
                              ? "Prof."
                              : experienceLabels[key]}
                        </span>
                        <span className="hidden sm:inline">
                          {experienceLabels[key]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-slate-600">
                    {strings.singer.fields.voice}
                  </p>
                  <div className="mt-2 flex flex-nowrap gap-1.5 overflow-x-auto">
                    {voiceOptions.map((voiceOption) => {
                      const isSelected = selectedVoice === voiceOption;
                      return (
                        <button
                          key={voiceOption}
                          type="button"
                          onClick={() => setSelectedVoice(voiceOption)}
                          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium transition ${
                            isSelected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                          aria-pressed={isSelected}
                        >
                          <Badge
                            dotColor={voiceColors[voiceOption]}
                            className={`border-0 px-0 py-0 text-[10px] ${
                              isSelected ? "text-white" : "text-slate-700"
                            }`}
                          >
                            {getVoiceLabel(voiceOption)}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    {strings.singer.save}
                  </button>
                </div>
              </form>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Mitgliedschaften
                  </h3>
                  <p className="text-sm text-slate-500">
                    Übersicht über deine Chöre und Rollen.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {membershipChoirs.map((item) => {
                  const choirEntry = choirs.find((entry) => entry.id === item.choir_id);
                  const isSelected = item.choir_id === selectedChoirId;
                  return (
                    <button
                      key={`${item.choir_id}-${item.voice}`}
                      type="button"
                      onClick={() => setSelectedChoirId(item.choir_id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition ${
                        isSelected
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-800">
                          {choirEntry?.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {choirEntry?.city} · {getVoiceLabel(item.voice)}
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2 text-[11px] text-slate-500">
                        {roleLabels.map((label) => (
                          <span
                            key={`${item.choir_id}-${label}`}
                            className="rounded-full border border-slate-200 px-2 py-0.5"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Neue Chöre können von der Leitung oder dem Vorstand für dich
                freigeschaltet werden.
              </p>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {strings.singer.projectTitle}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {choir?.name} · {project?.name}
                    </p>
                  </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setParticipationStatus("confirmed")}
                        disabled={participationStatus === "confirmed"}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          participationStatus === "confirmed"
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                        }`}
                      >
                        {participationStatus === "confirmed"
                          ? "Teilnahme bestätigt"
                          : "Teilnahme bestätigen"}
                      </button>
                      {paymentStatus === "confirmed" ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          Mitgliedschaftsbeitrag bezahlt
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPaymentStatus("pending")}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          Mitgliedschaftsbeitrag bezahlen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {strings.singer.sections.projectInfo}
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {project?.name ?? "Kein aktives Projekt"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {project
                      ? formatDateRange(project.date_range.start, project.date_range.end)
                      : ""}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {strings.singer.sections.projectInfo}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {project?.description}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {strings.singer.sections.concerts}
                  </p>
                  <ul className="mt-3 space-y-3 text-sm text-slate-600">
                    {concerts.length ? (
                      concerts.map((concert) => (
                        <li key={concert.id} className="rounded-xl border border-slate-100 p-3">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatDate(concert.date)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {concert.time} · {concert.place}
                          </p>
                        </li>
                      ))
                    ) : (
                      <li className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                        Noch keine Konzerttermine erfasst.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Anwesenheit Proben
                  </h3>
                  <p className="text-sm text-slate-500">
                    {choir?.name} · {project?.name}
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  {project?.rehearsal_facts.location}
                </div>
              </div>
              <div className="mt-6">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {strings.singer.sections.rehearsals}
                </p>
                <ul className="mt-3 space-y-3 text-sm text-slate-600">
                  {sortedRehearsals.length ? (
                    sortedRehearsals.map((rehearsal) => {
                      const isPresent = attendanceState[rehearsal.id];
                      return (
                      <li
                        key={rehearsal.id}
                        className="rounded-xl border border-slate-100 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatDate(rehearsal.date)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatTimeRange(rehearsal.start_time, rehearsal.end_time)} · {rehearsal.location}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setAttendanceState((prev) => ({
                                ...prev,
                                [rehearsal.id]: !prev[rehearsal.id]
                              }))
                            }
                            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                            aria-pressed={isPresent}
                          >
                            <span className="hidden text-xs text-slate-500 sm:inline">
                              {isPresent ? "anwesend" : "abwesend"}
                            </span>
                            <span
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-[11px] transition ${
                                isPresent
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-slate-200 text-slate-400"
                              }`}
                            >
                              {isPresent ? <Check className="h-3.5 w-3.5" /> : null}
                            </span>
                          </button>
                        </div>
                      </li>
                      );
                    })
                  ) : (
                    <li className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                      Noch keine nächsten Proben geplant.
                    </li>
                  )}
                </ul>
              </div>
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {strings.singer.sections.program}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {choir?.name} · {project?.name}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {program?.season ?? ""}
                </span>
              </div>
              <ol className="mt-4 space-y-3 text-sm text-slate-600">
                {(program?.pieces ?? []).slice(0, 6).map((piece, index) => (
                  <li
                    key={piece.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-800">
                            {piece.title}
                          </span>
                          {piece.duration ? (
                            <span className="text-xs text-slate-400">
                              {piece.duration}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {piece.composer}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
                          <a
                            href={piece.pdf_url}
                            onClick={(event) => event.preventDefault()}
                            className="text-slate-500 underline decoration-dashed underline-offset-4 transition hover:text-slate-700"
                          >
                            {strings.repertoire.pdfLink}
                          </a>
                          <a
                            href={piece.recording_url}
                            onClick={(event) => event.preventDefault()}
                            className="text-slate-500 underline decoration-dashed underline-offset-4 transition hover:text-slate-700"
                          >
                            {strings.repertoire.recordingLink}
                          </a>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              {program && program.pieces.length > 6 ? (
                <p className="mt-4 text-xs text-slate-500">
                  +{program.pieces.length - 6} weitere Stücke im Programm
                </p>
              ) : null}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
