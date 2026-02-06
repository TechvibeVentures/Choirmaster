"use client";

import { notFound } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import VoiceBadge from "@/components/VoiceBadge";
import { strings } from "@/lib/i18n";
import {
  availability,
  defaultChoirId,
  getMembership,
  getPersonName,
  people,
  projectParticipations,
  projects,
  rehearsalsByProject
} from "@/lib/mockData";
import { formatDate } from "@/lib/format";
import { getVoiceLabel } from "@/lib/labels";

const statusClasses: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-slate-200 bg-slate-50 text-slate-500",
  project_only: "border-amber-200 bg-amber-50 text-amber-700"
};

const roleLabels: Record<string, string> = {
  singer: "Sänger",
  chairman: "Vorstand",
  conductor: "Leitung",
  planner: "Planung"
};

const experienceLabels: Record<string, string> = {
  junior: "Einsteiger",
  regular: "Erfahren",
  advanced: "Fortgeschritten",
  professional: "Professionell"
};

const singerStatusLabels: Record<string, string> = {
  active: "Aktiv",
  inactive: "Inaktiv",
  project_only: "Projekt"
};

const inviteStatusLabels: Record<string, string> = {
  invited: "Eingeladen",
  confirmed: "Bestätigt",
  declined: "Abgesagt"
};

const paymentOptions = [
  { value: "open", label: "Offen" },
  { value: "partial", label: "Teilweise" },
  { value: "paid", label: "Bezahlt" }
];

export default function PersonDetailPage({
  params
}: {
  params: { personId: string };
}) {
  const person = people.find((item) => item.id === params.personId);

  if (!person) {
    notFound();
  }

  const membership = getMembership(person.id, defaultChoirId);
  const participations = projectParticipations.filter(
    (item) => item.person_id === person.id
  );

  const sortedParticipations = useMemo(() => {
    return [...participations].sort((a, b) => {
      const aProject = projects.find((item) => item.id === a.project_id);
      const bProject = projects.find((item) => item.id === b.project_id);
      return (
        new Date(`${bProject?.date_range.start ?? "1970-01-01"}T00:00:00`).getTime() -
        new Date(`${aProject?.date_range.start ?? "1970-01-01"}T00:00:00`).getTime()
      );
    });
  }, [participations]);

  const [selectedProjectId, setSelectedProjectId] = useState(
    sortedParticipations[0]?.project_id ?? ""
  );
  const [paymentStatus, setPaymentStatus] = useState("open");

  useEffect(() => {
    setSelectedProjectId(sortedParticipations[0]?.project_id ?? "");
  }, [sortedParticipations]);

  const selectedProject = projects.find(
    (item) => item.id === selectedProjectId
  );
  const selectedRehearsals = rehearsalsByProject[selectedProjectId] ?? [];

  const [availabilityByRehearsal, setAvailabilityByRehearsal] = useState<
    Record<string, "yes" | "no" | "unknown">
  >({});

  useEffect(() => {
    const next: Record<string, "yes" | "no" | "unknown"> = {};
    selectedRehearsals.forEach((rehearsal) => {
      const record = availability.find(
        (item) =>
          item.rehearsal_id === rehearsal.id && item.person_id === person.id
      );
      next[rehearsal.id] = record?.status ?? "unknown";
    });
    setAvailabilityByRehearsal(next);
  }, [person.id, selectedRehearsals]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {getPersonName(person)}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{person.email}</p>
            <p className="mt-1 text-sm text-slate-500">{person.city}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="text-slate-600">
                {experienceLabels[person.experience_level]}
              </Badge>
            </div>
          </div>
          {membership ? <VoiceBadge voice={membership.voice} /> : null}
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold">{strings.people.roles}</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {person.roles.map((role) => (
              <Badge key={role}>{roleLabels[role] ?? role}</Badge>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold">{strings.people.singerStatus}</h3>
          {membership ? (
            <div className="mt-4 flex items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs ${
                  statusClasses[membership.singer_status]
                }`}
              >
                {singerStatusLabels[membership.singer_status]}
              </span>
              <span className="text-sm text-slate-500">
                {getVoiceLabel(membership.voice)}
              </span>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Kein Profil</p>
          )}

          <div className="mt-6">
            <h4 className="text-xs uppercase text-slate-400">
              Zahlungsstatus
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {paymentOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPaymentStatus(option.value)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    paymentStatus === option.value
                      ? "border-slate-300 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold">
            {strings.people.participations}
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {participations.map((participation) => {
              const project = projects.find(
                (item) => item.id === participation.project_id
              );
              return (
                <li
                  key={participation.project_id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                >
                  <div className="font-medium text-slate-800">
                    {project?.name ?? "Projekt"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {project
                      ? `${formatDate(project.date_range.start)} – ${formatDate(
                          project.date_range.end
                        )}`
                      : ""}
                  </div>
                  <div className="mt-1 text-xs uppercase text-slate-400">
                    {inviteStatusLabels[participation.invite_status]}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <h3 className="text-base font-semibold">
            Anwesenheit pro Probe
          </h3>
          <div className="mt-4">
            <label className="text-xs uppercase text-slate-400">
              Projekt auswählen
            </label>
            <select
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/60"
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
            >
              {sortedParticipations.map((participation) => {
                const project = projects.find(
                  (item) => item.id === participation.project_id
                );
                return (
                  <option key={participation.project_id} value={participation.project_id}>
                    {project?.name ?? "Projekt"}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="mt-4 grid gap-3">
            {selectedRehearsals.map((rehearsal) => (
              <div
                key={rehearsal.id}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">
                      {formatDate(rehearsal.date)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {rehearsal.start_time}–{rehearsal.end_time} ·{" "}
                      {rehearsal.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(
                      [
                        { value: "yes", label: "Ja" },
                        { value: "no", label: "Nein" },
                        { value: "unknown", label: "Offen" }
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setAvailabilityByRehearsal((prev) => ({
                            ...prev,
                            [rehearsal.id]: option.value
                          }))
                        }
                        className={`rounded-full border px-2.5 py-1 text-xs transition ${
                          availabilityByRehearsal[rehearsal.id] === option.value
                            ? "border-slate-300 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {selectedProjectId === "" ? (
              <p className="text-sm text-slate-500">
                Keine Projekte ausgewählt.
              </p>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
