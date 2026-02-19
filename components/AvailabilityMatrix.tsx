"use client";

import Card from "@/components/Card";
import { Pencil } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import type {
  Availability,
  ChoirMembership,
  Project,
  ProjectParticipation,
  Rehearsal,
  Voice
} from "@/lib/domain/types";
import { formatDate, formatTimeRange } from "@/lib/format";
import { strings } from "@/lib/i18n";
import { getVoiceLabel } from "@/lib/labels";

const voiceOrder: Voice[] = ["Soprano", "Alto", "Tenor", "Bass"];

const voiceColors: Record<Voice, string> = {
  Soprano: "var(--voice-soprano)",
  Alto: "var(--voice-alto)",
  Tenor: "var(--voice-tenor)",
  Bass: "var(--voice-bass)"
};

type MatrixRow = {
  rehearsal: Rehearsal;
  counts: Record<Voice, { yes: number; no: number; unknown: number }>;
  status: "Bestätigt" | "Offen" | "Kritisch";
};

const groupAvailability = (
  rehearsal: Rehearsal,
  participations: ProjectParticipation[],
  records: Availability[],
  resolveMembership: (personId: string) => ChoirMembership | undefined
) => {
  const participants = participations
    .filter((item) => item.project_id === rehearsal.project_id)
    .map((item) => item.person_id);

  const counts: Record<Voice, { yes: number; no: number; unknown: number }> = {
    Soprano: { yes: 0, no: 0, unknown: 0 },
    Alto: { yes: 0, no: 0, unknown: 0 },
    Tenor: { yes: 0, no: 0, unknown: 0 },
    Bass: { yes: 0, no: 0, unknown: 0 }
  };

  participants.forEach((personId) => {
    const membership = resolveMembership(personId);
    if (!membership) return;

    const record = records.find(
      (item) =>
        item.rehearsal_id === rehearsal.id && item.person_id === personId
    );
    const status = record?.status ?? "unknown";
    counts[membership.voice][status] += 1;
  });

  return counts;
};

const getRowStatus = (
  counts: Record<Voice, { yes: number; no: number; unknown: number }>
): MatrixRow["status"] => {
  const totals = Object.values(counts).reduce(
    (acc, item) => {
      acc.yes += item.yes;
      acc.no += item.no;
      acc.unknown += item.unknown;
      return acc;
    },
    { yes: 0, no: 0, unknown: 0 }
  );

  if (totals.no >= 6 || totals.unknown >= 8) return "Kritisch";
  if (totals.unknown > 0) return "Offen";
  return "Bestätigt";
};

const getPercentClass = (value: number) => {
  if (value >= 75) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (value >= 50) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-rose-200 bg-rose-50 text-rose-700";
};

const getRehearsalType = (rehearsal: Rehearsal) => {
  const location = rehearsal.location.toLowerCase();
  if (location.includes("probetag")) return "Probetag";
  if (location.includes("vesper")) return "Vesper";
  if (location.includes("generalprobe")) return "Generalprobe";
  return "Probe";
};

export default function AvailabilityMatrix({
  projects
}: {
  projects: Project[];
}) {
  const {
    activeChoirId,
    availability,
    getMembership,
    projectParticipations,
    rehearsalsByProject
  } = useAppData();

  const rows: MatrixRow[] = projects
    .flatMap((project) => {
      const rehearsals = rehearsalsByProject[project.id] ?? [];
      return rehearsals.map((rehearsal) => {
        const counts = groupAvailability(
          rehearsal,
          projectParticipations,
          availability,
          (personId) => getMembership(personId, activeChoirId)
        );
        return {
          rehearsal,
          counts,
          status: getRowStatus(counts)
        };
      });
    })
    .sort(
      (a, b) =>
        new Date(`${a.rehearsal.date}T00:00:00`).getTime() -
        new Date(`${b.rehearsal.date}T00:00:00`).getTime()
    );

  const today = new Date();
  const nextRehearsalId = rows.find(
    (row) => new Date(`${row.rehearsal.date}T00:00:00`) >= today
  )?.rehearsal.id;

  const handleEdit = () => {
    window.alert("Diese Funktion kommt in einer späteren Version der App.");
  };

  return (
    <Card>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-900">
          Anwesenheit pro Probe
        </h2>
        <p className="text-sm text-slate-500">
          {strings.dashboard.availabilitySubtitle}
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[960px] w-max text-left text-xs sm:text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="py-2 pr-4 font-medium whitespace-nowrap">Datum</th>
              <th className="py-2 pr-4 font-medium whitespace-nowrap">Typ</th>
              <th className="py-2 pr-4 font-medium whitespace-nowrap">Status</th>
              {voiceOrder.map((voice) => (
                <th key={voice} className="py-2 pr-4 font-medium whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: voiceColors[voice] }}
                    />
                    <span>{getVoiceLabel(voice)}</span>
                  </div>
                </th>
              ))}
              <th className="py-2 pr-2 font-medium whitespace-nowrap"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row.rehearsal.id}
                className={`text-slate-600 ${
                  row.rehearsal.id === nextRehearsalId ? "bg-slate-50/60" : ""
                }`}
              >
                <td className="py-3 pr-4">
                  <div className="font-medium text-slate-800">
                    {formatDate(row.rehearsal.date)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatTimeRange(
                      row.rehearsal.start_time,
                      row.rehearsal.end_time
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 text-xs text-slate-500">
                  {getRehearsalType(row.rehearsal)}
                </td>
                <td className="py-3 pr-4 text-xs">
                  {(() => {
                    const total =
                      row.counts.Soprano.yes +
                      row.counts.Soprano.no +
                      row.counts.Soprano.unknown +
                      row.counts.Alto.yes +
                      row.counts.Alto.no +
                      row.counts.Alto.unknown +
                      row.counts.Tenor.yes +
                      row.counts.Tenor.no +
                      row.counts.Tenor.unknown +
                      row.counts.Bass.yes +
                      row.counts.Bass.no +
                      row.counts.Bass.unknown;
                    const yes =
                      row.counts.Soprano.yes +
                      row.counts.Alto.yes +
                      row.counts.Tenor.yes +
                      row.counts.Bass.yes;
                    const percent = total ? Math.round((yes / total) * 100) : 0;
                    return (
                      <span
                        className={`rounded-full border px-2 py-1 ${getPercentClass(
                          percent
                        )}`}
                      >
                        {percent}% bestätigt
                      </span>
                    );
                  })()}
                </td>
                {voiceOrder.map((voice) => {
                  const counts = row.counts[voice];
                  const total = counts.yes + counts.no + counts.unknown;
                  const yesPercent = total ? (counts.yes / total) * 100 : 100;
                  const warn =
                    yesPercent < 50
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-slate-200 bg-white text-slate-600";
                  return (
                    <td key={voice} className="py-3 pr-4">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs ${warn}`}
                      >
                        <span className="font-semibold text-slate-800">Ja:</span>{" "}
                        {counts.yes} ·{" "}
                        <span className="font-semibold text-slate-800">Nein:</span>{" "}
                        {counts.no} ·{" "}
                        <span className="font-semibold text-slate-800">Offen:</span>{" "}
                        {counts.unknown}
                      </span>
                    </td>
                  );
                })}
                <td className="py-3 pr-2 text-right">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
                    aria-label="Bearbeiten"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
