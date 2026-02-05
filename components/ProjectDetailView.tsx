"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil } from "lucide-react";
import Card from "@/components/Card";
import VoiceBadge from "@/components/VoiceBadge";
import { strings } from "@/lib/i18n";
import {
  availability,
  concertsByProject,
  defaultChoirId,
  getMembership,
  getPersonName,
  people,
  projectParticipations,
  projects,
  rehearsalsByProject,
  type Project,
  type Voice
} from "@/lib/mockData";
import {
  formatDate,
  formatDateRange,
  formatTimeRange,
  formatWeekdays
} from "@/lib/format";

const getProjectStatus = (project: Project) => {
  const today = new Date();
  const start = new Date(`${project.date_range.start}T00:00:00`);
  const end = new Date(`${project.date_range.end}T00:00:00`);

  if (today < start) {
    return {
      label: `${strings.projects.statusUpcoming} ${formatDate(
        project.date_range.start
      )}`,
      className: "border-slate-200 bg-slate-50 text-slate-600"
    };
  }
  if (today <= end) {
    return {
      label: strings.projects.statusActive,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700"
    };
  }
  return {
    label: strings.projects.statusArchived,
    className: "border-slate-200 bg-slate-50 text-slate-500"
  };
};

const getAvailabilitySummary = (rehearsalIds: string[], personId: string) => {
  return rehearsalIds.reduce(
    (acc, rehearsalId) => {
      const record = availability.find(
        (item) => item.rehearsal_id === rehearsalId && item.person_id === personId
      );
      const status = record?.status ?? "unknown";
      acc[status] += 1;
      return acc;
    },
    { yes: 0, no: 0, unknown: 0 }
  );
};

const inviteStatusLabels: Record<string, string> = {
  invited: strings.projects.inviteInvited,
  confirmed: strings.projects.inviteConfirmed,
  declined: strings.projects.inviteDeclined
};

const voiceBorderColors: Record<Voice, string> = {
  Soprano: "var(--voice-soprano)",
  Alto: "var(--voice-alto)",
  Tenor: "var(--voice-tenor)",
  Bass: "var(--voice-bass)"
};

export default function ProjectDetailView({ projectId }: { projectId: string }) {
  const project = projects.find((item) => item.id === projectId);

  if (!project) {
    return null;
  }

  const [showAllRehearsals, setShowAllRehearsals] = useState(false);
  const [showAllConcerts, setShowAllConcerts] = useState(false);
  const [showAllProgram, setShowAllProgram] = useState(false);

  const handleComingSoon = () => {
    window.alert("Diese Funktion kommt in einer späteren Version der App.");
  };

  const concertProgram = [
    { title: "The Parting Glass", composer: "Trad. Irish / Arr. J. Wilson" },
    { title: "Sally Gardens", composer: "Herbert Hughes" },
    { title: "The Skye Boat Song", composer: "Trad. Scottish / Arr. J. Rutter" },
    { title: "Greensleeves", composer: "Trad. English / Arr. R. Vaughan Williams" },
    { title: "Caledonia", composer: "Dougie MacLean / Arr. P. Knight" },
    { title: "Loch Lomond", composer: "Trad. Scottish / Arr. J. L. Frazier" },
    { title: "Scarborough Fair", composer: "Trad. English / Arr. J. Rutter" },
    { title: "Fields of Gold", composer: "Sting / Arr. P. Lawson" },
    { title: "Danny Boy", composer: "Trad. / Arr. J. Larsson" },
    { title: "The Water is Wide", composer: "Trad. / Arr. J. Carter" },
    { title: "A Gaelic Blessing", composer: "John Rutter" },
    { title: "My Love is Like a Red, Red Rose", composer: "Trad. / Arr. R. Browne" },
    { title: "Wild Mountain Thyme", composer: "Trad. / Arr. B. Chilcott" },
    { title: "The Ash Grove", composer: "Trad. Welsh / Arr. D. Willcocks" },
    { title: "All Through the Night", composer: "Trad. Welsh / Arr. P. Knight" },
    { title: "She Moved Through the Fair", composer: "Trad. / Arr. H. Davies" },
    { title: "The Parting Glass (Reprise)", composer: "Trad. / Arr. J. Wilson" },
    { title: "The Lark in the Clear Air", composer: "Trad. / Arr. E. Daley" },
    { title: "Skye Boat Song (Encore)", composer: "Trad. / Arr. J. Rutter" },
    { title: "Abide with Me", composer: "William H. Monk / Arr. A. Briggs" }
  ];

  const splitConcertSegments = (timeLabel: string) =>
    timeLabel.split("·").map((segment) => segment.trim()).filter(Boolean);

  const concerts = concertsByProject[project.id] ?? [];
  const rehearsals = rehearsalsByProject[project.id] ?? [];
  const rehearsalIds = rehearsals.map((item) => item.id);
  const conductors = people.filter((person) =>
    person.roles.includes("conductor")
  );
  const conductorIds = new Set(conductors.map((person) => person.id));
  const participants = projectParticipations.filter(
    (item) =>
      item.project_id === project.id &&
      item.invite_status === "confirmed" &&
      !conductorIds.has(item.person_id)
  );
  const status = getProjectStatus(project);
  const nextRehearsal = rehearsals
    .filter(
      (rehearsal) => new Date(`${rehearsal.date}T00:00:00`) >= new Date()
    )
    .sort(
      (a, b) =>
        new Date(`${a.date}T00:00:00`).getTime() -
        new Date(`${b.date}T00:00:00`).getTime()
    )[0];
  const upcomingConcerts = concerts
    .filter((concert) => new Date(`${concert.date}T00:00:00`) >= new Date())
    .sort(
      (a, b) =>
        new Date(`${a.date}T00:00:00`).getTime() -
        new Date(`${b.date}T00:00:00`).getTime()
    );
  const nextConcert = upcomingConcerts[0];
  const secondConcert = upcomingConcerts[1];
  const inviteSummary = participants.reduce(
    (acc, participant) => {
      acc[participant.invite_status] += 1;
      return acc;
    },
    { confirmed: 0, invited: 0, declined: 0 }
  );
  const participantRows = participants.map((participant) => {
    const person = people.find((item) => item.id === participant.person_id);
    const membership = getMembership(participant.person_id, defaultChoirId);
    const availabilitySummary = getAvailabilitySummary(
      rehearsalIds,
      participant.person_id
    );

    return {
      ...participant,
      person,
      membership,
      availabilitySummary
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {project.name}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {formatDateRange(project.date_range.start, project.date_range.end)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${status.className}`}
              >
                {status.label}
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleComingSoon();
                }}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                aria-label={strings.projects.edit}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {project.description ? (
            <p className="mt-3 text-sm text-slate-500">{project.description}</p>
          ) : null}

          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase text-slate-400">
                {strings.projects.rehearsalRhythm}
              </div>
              <div className="mt-1">
                {formatWeekdays(project.rehearsal_facts.weekdays)} ·{" "}
                {formatTimeRange(
                  project.rehearsal_facts.start_time,
                  project.rehearsal_facts.end_time
                )}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400">
                {strings.projects.location}
              </div>
              <div className="mt-1">{project.rehearsal_facts.location}</div>
            </div>
          </div>

          {conductors.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-xs uppercase text-slate-400">
                {strings.projects.conductors}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {conductors.map((person) => {
                  const membership = getMembership(person.id, defaultChoirId);
                  return (
                    <Link
                      key={person.id}
                      href={`/people/${person.id}`}
                      className="block"
                    >
                      <div
                        className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300"
                        style={{
                          borderLeftWidth: "4px",
                          borderLeftColor: membership
                            ? voiceBorderColors[membership.voice]
                            : "transparent"
                        }}
                      >
                        <div className="text-sm font-semibold text-slate-900">
                          {getPersonName(person)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {person.city}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </Card>

        <Card>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            {strings.projects.schedule}
          </div>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            <div>
              <div className="text-xs uppercase text-slate-400">
                {strings.projects.nextRehearsal}
              </div>
              <div className="mt-1 text-sm text-slate-700">
                {nextRehearsal
                  ? `${formatDate(nextRehearsal.date)} · ${formatTimeRange(
                      nextRehearsal.start_time,
                      nextRehearsal.end_time
                    )}`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400">
                {strings.projects.concerts}
              </div>
              <div className="mt-1 text-sm text-slate-700">
                {nextConcert
                  ? `${formatDate(nextConcert.date)} · ${nextConcert.place}`
                  : "—"}
              </div>
              {secondConcert ? (
                <div className="mt-1 text-sm text-slate-700">
                  {formatDate(secondConcert.date)} · {secondConcert.place}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
              {strings.projects.rehearsalsTotal} · {rehearsals.length}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
              {strings.projects.concertsTotal} · {concerts.length}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
              {strings.projects.participantsTotal} · {participantRows.length}
            </span>
          </div>

          <div className="mt-4">
            <div className="text-xs uppercase text-slate-400">
              {strings.projects.participantsStatus}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                {strings.projects.inviteConfirmed} · {inviteSummary.confirmed}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                {strings.projects.inviteInvited} · {inviteSummary.invited}
              </span>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700">
                {strings.projects.inviteDeclined} · {inviteSummary.declined}
              </span>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Link href="/repertoire" className="block h-full">
          <Card className="flex h-full min-h-[320px] flex-col transition hover:border-slate-300">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Konzertprogramm</h3>
              <button
                type="button"
                onClick={handleComingSoon}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                aria-label={strings.projects.edit}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-4 flex-1">
              <ol className="space-y-2 text-sm text-slate-600">
                {(showAllProgram
                  ? concertProgram
                  : concertProgram.slice(0, 3)
                ).map((piece, index) => (
                  <li
                    key={`${piece.title}-${index}`}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 text-sm text-slate-700">
                        {piece.title}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {piece.composer}
                    </div>
                  </li>
                ))}
              </ol>
              {concertProgram.length > 3 ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setShowAllProgram((prev) => !prev);
                  }}
                  className="mt-3 w-full rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                >
                  {showAllProgram
                    ? "Weniger anzeigen"
                    : `${concertProgram.length - 3} weitere Stücke`}
                </button>
              ) : null}
            </div>
          </Card>
        </Link>
        <Card className="flex h-full min-h-[320px] flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">{strings.projects.rehearsals}</h3>
              <Link
                href="/dashboard#availability"
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                {strings.projects.attendanceButton}
              </Link>
            </div>
            <button
              type="button"
              onClick={handleComingSoon}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              aria-label={strings.projects.edit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-4 flex-1">
            <ul className="space-y-3 text-sm text-slate-600">
              {(showAllRehearsals ? rehearsals : rehearsals.slice(0, 3)).map(
                (rehearsal) => (
                <li
                  key={rehearsal.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                >
                  <div className="font-medium text-slate-800">
                    {formatDate(rehearsal.date)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatTimeRange(rehearsal.start_time, rehearsal.end_time)} ·{" "}
                    {rehearsal.location}
                  </div>
                </li>
              ))}
            </ul>
            {rehearsals.length > 3 ? (
              <button
                type="button"
                onClick={() => setShowAllRehearsals((prev) => !prev)}
                className="mt-3 w-full rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                {showAllRehearsals
                  ? "Weniger anzeigen"
                  : `${rehearsals.length - 3} weitere Proben`}
              </button>
            ) : null}
          </div>
        </Card>
        <Card className="flex h-full min-h-[320px] flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{strings.projects.concerts}</h3>
            <button
              type="button"
              onClick={handleComingSoon}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              aria-label={strings.projects.edit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-4 flex-1">
            <ul className="space-y-3 text-sm text-slate-600">
              {(showAllConcerts ? concerts : concerts.slice(0, 3)).map(
                (concert) => (
                <li
                  key={concert.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                >
                  <div className="font-medium text-slate-800">
                    {formatDate(concert.date)}
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    {splitConcertSegments(concert.time).map((segment, index) => (
                      <div key={`${concert.id}-segment-${index}`}>
                        {segment} · {concert.place}
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            {concerts.length > 3 ? (
              <button
                type="button"
                onClick={() => setShowAllConcerts((prev) => !prev)}
                className="mt-3 w-full rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                {showAllConcerts
                  ? "Weniger anzeigen"
                  : `${concerts.length - 3} weitere Konzerte`}
              </button>
            ) : null}
          </div>
        </Card>
      </section>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {strings.projects.participants}
          </h3>
          <span className="text-xs text-slate-500">
            {participantRows.length} total
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[640px] w-full text-left text-xs sm:text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2 pr-4 font-medium whitespace-nowrap">Name</th>
                <th className="py-2 pr-4 font-medium whitespace-nowrap">Stimme</th>
                <th className="py-2 pr-4 font-medium whitespace-nowrap">Status</th>
                <th className="py-2 pr-4 font-medium whitespace-nowrap">Anwesenheit</th>
                <th className="py-2 font-medium whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participantRows.map((row) => (
                <tr key={row.person_id} className="text-slate-600">
                  <td className="py-3 pr-4 font-medium text-slate-800">
                    {row.person ? (
                      <Link
                        href={`/people/${row.person.id}`}
                        className="transition hover:text-slate-900"
                      >
                        {getPersonName(row.person)}
                      </Link>
                    ) : (
                      "Unbekannt"
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {row.membership ? (
                      <VoiceBadge voice={row.membership.voice} />
                    ) : null}
                  </td>
                  <td className="py-3 pr-4 text-xs uppercase text-slate-500">
                    {inviteStatusLabels[row.invite_status]}
                  </td>
                  <td className="py-3 text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">
                      {row.availabilitySummary.yes}
                    </span>{" "}
                    Ja ·{" "}
                    <span className="font-semibold text-slate-800">
                      {row.availabilitySummary.no}
                    </span>{" "}
                    Nein ·{" "}
                    <span className="font-semibold text-slate-800">
                      {row.availabilitySummary.unknown}
                    </span>{" "}
                    Offen
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={handleComingSoon}
                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      aria-label={strings.projects.edit}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
