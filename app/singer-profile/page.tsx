"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import { useAppData } from "@/hooks/useAppData";
import type { Concert, Project, Rehearsal, Voice } from "@/lib/domain/types";
import {
  mergeAvailabilityRows,
  mergeCurrentPerson,
  mergeMembershipVoice
} from "@/lib/domain/snapshotMutations";
import { formatDate, formatDateRange, formatTimeRange, formatWeekdays } from "@/lib/format";
import { strings } from "@/lib/i18n";
import { getVoiceLabel } from "@/lib/labels";

const voiceColors: Record<Voice, string> = {
  Soprano: "var(--voice-soprano)",
  Alto: "var(--voice-alto)",
  Tenor: "var(--voice-tenor)",
  Bass: "var(--voice-bass)"
};

const getCurrentProject = (
  projects: Project[],
  choirId: string
) => {
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

const buildAttendanceState = (
  rehearsalIds: string[],
  personId: string,
  availability: Array<{ rehearsal_id: string; person_id: string; status: "yes" | "no" | "unknown" }>
) => {
  return rehearsalIds.reduce<Record<string, boolean>>((acc, rehearsalId) => {
    const row = availability.find(
      (item) => item.rehearsal_id === rehearsalId && item.person_id === personId
    );
    acc[rehearsalId] = row?.status === "yes";
    return acc;
  }, {});
};

const EMPTY_REHEARSALS: Rehearsal[] = [];
const EMPTY_CONCERTS: Concert[] = [];

const mapRoleToLabel = (role: string) => {
  if (role === "chairman") return "Vorstand";
  if (role === "conductor") return "Leitung";
  return "Sänger";
};

const getRoleLabels = (roles?: string[]) => {
  const labels = (roles || []).map(mapRoleToLabel);
  const unique = Array.from(new Set(labels));
  return unique.length ? unique : ["Sänger"];
};

export default function SingerViewPage() {
  const {
    activeChoirId,
    availability,
    choirs,
    concertPrograms,
    concertsByProject,
    currentPersonId,
    allMemberships,
    allPeople,
    allProjects,
    projectParticipations,
    rehearsalsByProject,
    replaceSnapshot,
    snapshot
  } = useAppData();

  const singer = allPeople.find((person) => person.id === currentPersonId) ?? allPeople[0];
  const membership = useMemo(
    () => allMemberships.find((item) => item.person_id === singer?.id),
    [allMemberships, singer?.id]
  );
  const membershipChoirs = useMemo(
    () => allMemberships.filter((item) => item.person_id === singer?.id),
    [allMemberships, singer?.id]
  );
  const defaultSelectedChoirId = membershipChoirs[0]?.choir_id ?? activeChoirId;
  const [selectedChoirId, setSelectedChoirId] = useState(defaultSelectedChoirId);

  useEffect(() => {
    if (
      selectedChoirId &&
      membershipChoirs.some((item) => item.choir_id === selectedChoirId)
    ) {
      return;
    }
    setSelectedChoirId(defaultSelectedChoirId);
  }, [defaultSelectedChoirId, membershipChoirs, selectedChoirId]);

  const choir = useMemo(
    () => choirs.find((entry) => entry.id === selectedChoirId) ?? choirs[0],
    [choirs, selectedChoirId]
  );
  const selectedMembership = useMemo(
    () => membershipChoirs.find((item) => item.choir_id === selectedChoirId),
    [membershipChoirs, selectedChoirId]
  );
  const project = useMemo(
    () => getCurrentProject(allProjects, selectedChoirId),
    [allProjects, selectedChoirId]
  );
  const rehearsals = useMemo(
    () => (project ? rehearsalsByProject[project.id] ?? EMPTY_REHEARSALS : EMPTY_REHEARSALS),
    [project, rehearsalsByProject]
  );
  const concerts = useMemo(
    () => (project ? concertsByProject[project.id] ?? EMPTY_CONCERTS : EMPTY_CONCERTS),
    [concertsByProject, project]
  );
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
  const [firstName, setFirstName] = useState(singer?.first_name ?? "");
  const [lastName, setLastName] = useState(singer?.last_name ?? "");
  const [email, setEmail] = useState(singer?.email ?? "");
  const [phone, setPhone] = useState(singer?.phone ?? "");
  const [city, setCity] = useState(singer?.city ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const [profileSaveSuccess, setProfileSaveSuccess] = useState("");
  const [participationStatus, setParticipationStatus] = useState<
    "invited" | "confirmed" | "declined"
  >(participation?.invite_status ?? "invited");
  const [paymentStatus, setPaymentStatus] = useState<
    "unpaid" | "pending" | "confirmed"
  >("unpaid");
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceSaveError, setAttendanceSaveError] = useState("");
  const [attendanceSaveSuccess, setAttendanceSaveSuccess] = useState("");
  const [dirtyRehearsalIds, setDirtyRehearsalIds] = useState<Set<string>>(
    () => new Set()
  );
  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>(
    () =>
      buildAttendanceState(
        sortedRehearsals.map((item) => item.id),
        singer?.id || "",
        availability
      )
  );
  const attendanceStateRef = useRef(attendanceState);
  const attendanceContextRef = useRef<string>("");

  useEffect(() => {
    attendanceStateRef.current = attendanceState;
  }, [attendanceState]);

  const voiceOptions = useMemo(() => ["Soprano", "Alto", "Tenor", "Bass"] as Voice[], []);
  const voiceLabel = selectedVoice ? getVoiceLabel(selectedVoice) : "Stimme offen";
  const voiceColor = selectedVoice ? voiceColors[selectedVoice] : "#E2E8F0";

  useEffect(() => {
    setSelectedVoice(selectedMembership?.voice ?? voice ?? null);
    setSelectedExperience(singer?.experience_level ?? "regular");
    setFirstName(singer?.first_name ?? "");
    setLastName(singer?.last_name ?? "");
    setEmail(singer?.email ?? "");
    setPhone(singer?.phone ?? "");
    setCity(singer?.city ?? "");
    setParticipationStatus(participation?.invite_status ?? "invited");
    setPaymentStatus("unpaid");
    setProfileSaveError("");
    setProfileSaveSuccess("");
  }, [
    selectedMembership?.voice,
    singer?.city,
    singer?.email,
    singer?.experience_level,
    singer?.first_name,
    singer?.id,
    singer?.last_name,
    singer?.phone,
    participation?.invite_status,
    voice
  ]);

  useEffect(() => {
    const attendanceContext = [
      singer?.id || "",
      selectedChoirId || "",
      project?.id || "",
      sortedRehearsals.map((item) => item.id).join(",")
    ].join(":");
    const attendanceContextChanged = attendanceContextRef.current !== attendanceContext;
    attendanceContextRef.current = attendanceContext;

    if (!attendanceContextChanged && (savingAttendance || dirtyRehearsalIds.size > 0)) {
      return;
    }

    setAttendanceState(
      buildAttendanceState(
        sortedRehearsals.map((item) => item.id),
        singer?.id || "",
        availability
      )
    );
    setDirtyRehearsalIds(new Set());
    setAttendanceSaveError("");
    setAttendanceSaveSuccess("");
  }, [
    availability,
    dirtyRehearsalIds.size,
    project?.id,
    savingAttendance,
    selectedChoirId,
    singer?.id,
    sortedRehearsals
  ]);

  const saveProfile = async () => {
    if (!singer || !selectedVoice || !selectedChoirId) {
      setProfileSaveError("Profil konnte nicht gespeichert werden.");
      return;
    }

    setSavingProfile(true);
    setProfileSaveError("");
    setProfileSaveSuccess("");
    try {
      const response = await fetch("/api/profile/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          city: city.trim(),
          experience_level: selectedExperience,
          voice: selectedVoice,
          choir_id: selectedChoirId
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "save failed");
      }

      let nextSnapshot = mergeCurrentPerson(snapshot, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        city: city.trim(),
        experience_level: selectedExperience
      });
      nextSnapshot = mergeMembershipVoice(
        nextSnapshot,
        selectedChoirId,
        singer.id,
        selectedVoice
      );
      replaceSnapshot(nextSnapshot);

      setProfileSaveSuccess(
        payload.emailChangeRequested
          ? "Profil gespeichert. Bitte bestätige die E-Mail-Änderung über den Link in deinem Postfach."
          : "Profil gespeichert."
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Profil konnte nicht gespeichert werden.";
      setProfileSaveError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleAttendance = (rehearsalId: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [rehearsalId]: !prev[rehearsalId]
    }));
    setDirtyRehearsalIds((prev) => {
      const next = new Set(prev);
      next.add(rehearsalId);
      return next;
    });
    setAttendanceSaveSuccess("");
  };

  const saveAttendance = async () => {
    if (!project || dirtyRehearsalIds.size === 0) return;

    const entries = Array.from(dirtyRehearsalIds).map((rehearsalId) => ({
      rehearsalId,
      status: attendanceStateRef.current[rehearsalId] ? "yes" : "no"
    }));
    const savedStatusByRehearsalId = new Map(
      entries.map((entry) => [entry.rehearsalId, entry.status])
    );

    setSavingAttendance(true);
    setAttendanceSaveError("");
    setAttendanceSaveSuccess("");
    try {
      const response = await fetch("/api/availability/batch", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId: project.id,
          entries
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "save failed");
      }

      replaceSnapshot(mergeAvailabilityRows(snapshot, payload.rows || []));
      setDirtyRehearsalIds((prev) => {
        const next = new Set(prev);
        for (const rehearsalId of savedStatusByRehearsalId.keys()) {
          const currentStatus = attendanceStateRef.current[rehearsalId] ? "yes" : "no";
          if (currentStatus === savedStatusByRehearsalId.get(rehearsalId)) {
            next.delete(rehearsalId);
          }
        }
        return next;
      });
      setAttendanceSaveSuccess("Anwesenheiten gespeichert.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Anwesenheiten konnten nicht gespeichert werden.";
      setAttendanceSaveError(message);
    } finally {
      setSavingAttendance(false);
    }
  };

  useEffect(() => {
    if (!project || savingAttendance || dirtyRehearsalIds.size === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      void saveAttendance();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [attendanceState, dirtyRehearsalIds, project, savingAttendance]);

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
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    type="text"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  {strings.singer.fields.lastName}
                  <input
                    className={inputStyles}
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    type="text"
                  />
                </label>
                <label className="text-sm text-slate-600 sm:col-span-2">
                  {strings.singer.fields.email}
                  <input
                    className={inputStyles}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  {strings.singer.fields.phone}
                  <input
                    className={inputStyles}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    type="tel"
                    placeholder="+41 79 000 00 00"
                  />
                </label>
                <label className="text-sm text-slate-600">
                Ort
                <input
                  className={inputStyles}
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
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
                        {experienceLabels[key]}
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
                          className={`shrink-0 rounded-full border px-1 py-0.5 text-[8px] font-medium transition ${
                            isSelected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                          aria-pressed={isSelected}
                        >
                          <Badge
                            dotColor={voiceColors[voiceOption]}
                            className={`border-0 px-0 py-0 text-[8px] ${
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
                    onClick={() => void saveProfile()}
                    disabled={savingProfile}
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    {savingProfile ? "Speichert..." : strings.singer.save}
                  </button>
                </div>
                {profileSaveError ? (
                  <p className="sm:col-span-2 text-sm text-rose-600">{profileSaveError}</p>
                ) : null}
                {profileSaveSuccess ? (
                  <p className="sm:col-span-2 text-sm text-emerald-700">{profileSaveSuccess}</p>
                ) : null}
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
                {membershipChoirs.map((item, membershipIndex) => {
                  const choirEntry = choirs.find((entry) => entry.id === item.choir_id);
                  const isSelected = item.choir_id === selectedChoirId;
                  const roleLabels = getRoleLabels(item.roles);
                  return (
                    <button
                      key={`${item.choir_id}-${membershipIndex}`}
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
                        {roleLabels.map((label, labelIndex) => (
                          <span
                            key={`${item.choir_id}-${label}-${labelIndex}`}
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
                            onClick={() => toggleAttendance(rehearsal.id)}
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
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => void saveAttendance()}
                    disabled={dirtyRehearsalIds.size === 0 || savingAttendance || !project}
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    {savingAttendance ? "Speichert..." : "Anwesenheiten speichern"}
                  </button>
                </div>
                {attendanceSaveError ? (
                  <p className="mt-3 text-sm text-rose-600">{attendanceSaveError}</p>
                ) : null}
                {attendanceSaveSuccess ? (
                  <p className="mt-3 text-sm text-emerald-700">{attendanceSaveSuccess}</p>
                ) : null}
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
