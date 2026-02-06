"use client";

import { notFound } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import VoiceBadge from "@/components/VoiceBadge";
import { strings } from "@/lib/i18n";
import {
  availability,
  choirs,
  defaultChoirId,
  getMembership,
  getPersonName,
  memberships,
  people,
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

const experienceLabels: Record<string, string> = {
  junior: "Einsteiger",
  regular: "Erfahren",
  advanced: "Fortgeschritten",
  professional: "Professionell"
};

const paymentOptions = [
  { value: "open", label: "Offen" },
  { value: "paid", label: "Bezahlt" }
];

const getChoirRoleLabel = (roles: string[]) => {
  if (roles.includes("conductor")) return "Leitung";
  if (roles.includes("chairman")) return "Vorstand";
  return "Sänger";
};

const getCurrentProjectForChoir = (choirId: string) => {
  const today = new Date();
  const choirProjects = projects.filter((project) => project.choir_id === choirId);
  const sorted = [...choirProjects].sort(
    (a, b) =>
      new Date(`${a.date_range.start}T00:00:00`).getTime() -
      new Date(`${b.date_range.start}T00:00:00`).getTime()
  );
  const active = sorted.find(
    (project) =>
      new Date(`${project.date_range.end}T00:00:00`) >= today
  );
  return active ?? sorted[0];
};

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
  const personMemberships = memberships.filter(
    (entry) => entry.person_id === person.id
  );
  const [selectedChoirId, setSelectedChoirId] = useState(
    personMemberships[0]?.choir_id ?? defaultChoirId
  );
  const [paymentStatus, setPaymentStatus] = useState("open");

  useEffect(() => {
    setSelectedChoirId(personMemberships[0]?.choir_id ?? defaultChoirId);
  }, [personMemberships]);

  const selectedProject = useMemo(
    () => getCurrentProjectForChoir(selectedChoirId),
    [selectedChoirId]
  );
  const selectedProjectId = selectedProject?.id ?? "";
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
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-6">
          <Card className="w-full max-w-[520px]">
            <div className="flex items-start justify-between gap-4">
              <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {getPersonName(person)}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{person.email}</p>
            <p className="mt-1 text-sm text-slate-500">{person.city}</p>
          </div>
          {membership ? <VoiceBadge voice={membership.voice} /> : null}
        </div>
            <div className="mt-4 flex justify-end">
              <Badge className="text-slate-600">
                {experienceLabels[person.experience_level]}
              </Badge>
            </div>
          </Card>

          <Card className="w-full max-w-[520px]">
            <h3 className="text-base font-semibold">Ensembles</h3>
            <div className="mt-4 grid gap-3">
              {personMemberships.map((entry) => {
                const choir = choirs.find((item) => item.id === entry.choir_id);
                return (
                  <button
                    key={entry.choir_id}
                    type="button"
                    onClick={() => setSelectedChoirId(entry.choir_id)}
                    className="text-left"
                  >
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {choir?.name ?? "Ensemble"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {choir?.city ?? ""}
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                          {getChoirRoleLabel(person.roles)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <span
                          className={`rounded-full border px-2 py-1 ${statusClasses[entry.singer_status]}`}
                        >
                          {entry.singer_status === "active"
                            ? "Aktiv"
                            : entry.singer_status === "inactive"
                              ? "Inaktiv"
                              : "Projekt"}
                        </span>
                        <span>{getVoiceLabel(entry.voice)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <h3 className="text-base font-semibold">Aktuelles Projekt</h3>
            {selectedProject ? (
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    {selectedProject.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDate(selectedProject.date_range.start)} –{" "}
                    {formatDate(selectedProject.date_range.end)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                    Aktiv
                  </span>
                  <span>{selectedProject.rehearsal_facts.location}</span>
                </div>
                <div className="mt-4">
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
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Kein Projekt ausgewählt.
              </p>
            )}
          </Card>

          <Card>
            <h3 className="text-base font-semibold">Anwesenheit pro Probe</h3>
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
                  Kein Projekt ausgewählt.
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
