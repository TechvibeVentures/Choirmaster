import AvailabilityMatrix from "@/components/AvailabilityMatrix";
import Card from "@/components/Card";
import {
  availability,
  choirs,
  concertsByProject,
  defaultChoirId,
  memberships,
  projectParticipations,
  projects,
  rehearsalsByProject,
  type Voice
} from "@/lib/mockData";
import { formatDate, formatTimeRange } from "@/lib/format";
import { getVoiceLabel } from "@/lib/labels";

const voiceOrder: Voice[] = ["Soprano", "Alto", "Tenor", "Bass"];

const voiceColors: Record<Voice, string> = {
  Soprano: "var(--voice-soprano)",
  Alto: "var(--voice-alto)",
  Tenor: "var(--voice-tenor)",
  Bass: "var(--voice-bass)"
};

const getCurrentProject = () => {
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

  return active ?? sorted[0];
};

export default function DashboardPage() {
  const project = getCurrentProject();
  const choirName = choirs[0]?.name ?? "";
  const rehearsals = project ? rehearsalsByProject[project.id] ?? [] : [];
  const concerts = project ? concertsByProject[project.id] ?? [] : [];
  const nextRehearsal = rehearsals
    .filter(
      (rehearsal) => new Date(`${rehearsal.date}T00:00:00`) >= new Date()
    )
    .sort(
      (a, b) =>
        new Date(`${a.date}T00:00:00`).getTime() -
        new Date(`${b.date}T00:00:00`).getTime()
    )[0];

  const projectParticipants = projectParticipations.filter(
    (item) => item.project_id === project?.id
  );
  const confirmedIds = new Set(
    projectParticipants
      .filter((item) => item.invite_status === "confirmed")
      .map((item) => item.person_id)
  );

  type VoiceStat = {
    voice: Voice;
    total: number;
    active: number;
    passive: number;
    former: number;
  };

  const voiceStats: VoiceStat[] = voiceOrder.map((voice) => {
    const members = memberships.filter(
      (member) =>
        member.choir_id === defaultChoirId && member.voice === voice
    );
    const total = members.length;
    const active = members.filter((member) =>
      confirmedIds.has(member.person_id)
    ).length;
    const passive = total - active;
    const former = members.filter(
      (member) => member.singer_status === "inactive"
    ).length;
    return { voice, total, active, passive, former };
  });

  const activeTotal = voiceStats.reduce((sum, item) => sum + item.active, 0);
  const totalSingers = voiceStats.reduce((sum, item) => sum + item.total, 0);
  const formerTotal = voiceStats.reduce((sum, item) => sum + item.former, 0);
  const totalProjectSingers = projectParticipants.length;
  const perVoiceTarget = totalProjectSingers ? totalProjectSingers / 4 : 0;

  const completedRehearsals = rehearsals.filter(
    (rehearsal) => new Date(`${rehearsal.date}T00:00:00`) < new Date()
  ).length;

  const progressRatio = rehearsals.length
    ? completedRehearsals / rehearsals.length
    : 0;

  const getPercentClass = (value: number) => {
    if (value >= 75) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (value >= 50) {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }
    return "border-rose-200 bg-rose-50 text-rose-700";
  };

  const getFlagClass = (value: number) => {
    if (!perVoiceTarget) {
      return "border-slate-200 bg-slate-50 text-slate-500";
    }
    if (value >= perVoiceTarget * 0.75) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (value >= perVoiceTarget * 0.5) {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }
    return "border-rose-200 bg-rose-50 text-rose-700";
  };

  const getActiveTagClass = (value: number) => {
    if (value > 6) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (value > 4) {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }
    return "border-rose-200 bg-rose-50 text-rose-700";
  };

  const membershipByPerson = new Map(
    memberships.map((member) => [member.person_id, member.voice])
  );

  const availabilityYesCount = nextRehearsal
    ? availability.filter(
        (item) =>
          item.rehearsal_id === nextRehearsal.id && item.status === "yes"
      ).length
    : 0;
  const availabilityPercent = totalProjectSingers
    ? Math.round((availabilityYesCount / totalProjectSingers) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="w-full min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">Sänger</h2>
            <span className="text-xs text-slate-400">{choirName}</span>
          </div>
          <div className="mt-3 max-w-full overflow-x-auto">
            <table className="w-full min-w-full table-fixed text-left text-xs sm:min-w-[360px] sm:text-sm">
              <colgroup>
                <col className="w-1/4" />
                <col className="w-1/4" />
                <col className="w-1/4" />
                <col className="w-1/4" />
              </colgroup>
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  {voiceOrder.map((voice) => (
                    <th key={voice} className="py-2 pr-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: voiceColors[voice] }}
                        />
                        <span>{getVoiceLabel(voice)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(
                  [
                    { label: "aktiv", shortLabel: "aktiv", key: "active" },
                    { label: "passiv", shortLabel: "passiv", key: "passive" },
                    { label: "ehemalig", shortLabel: "ehem.", key: "former" }
                  ] as {
                    label: string;
                    shortLabel: string;
                    key: "active" | "passive" | "former";
                  }[]
                ).map((row) => {
                  const label = (
                    <>
                      <span className="sm:hidden">{row.shortLabel}</span>
                      <span className="hidden sm:inline">{row.label}</span>
                    </>
                  );
                  return (
                  <tr key={row.key} className="text-slate-600">
                    {voiceStats.map((voiceRow) => (
                      <td key={voiceRow.voice} className="py-2 pr-3">
                        {row.key === "active" ? (
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-xs ${getActiveTagClass(
                              voiceRow.active
                            )}`}
                          >
                            {voiceRow.active} {label}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
                            {voiceRow[row.key]} {label}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-col gap-2 text-xs text-slate-400">
            <span>
              {totalSingers} gesamt · {activeTotal} aktiv ·{" "}
              {totalSingers - activeTotal} passiv · {formerTotal} ehemalig
            </span>
            <span
              className={`inline-flex w-fit rounded-full border px-2 py-1 ${getPercentClass(
                availabilityPercent
              )}`}
            >
              Bestätigte Anwesenheit {availabilityPercent}%
            </span>
          </div>
        </Card>

        <Card className="w-full min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">Projekt</h2>
            <span className="text-xs text-slate-400">
              {project?.name ?? "—"}
            </span>
          </div>
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-xs uppercase text-slate-400">Nächste Probe</p>
            <p className="mt-1 text-sm text-slate-700">
              {nextRehearsal
                ? `${formatDate(nextRehearsal.date)} · ${formatTimeRange(
                    nextRehearsal.start_time,
                    nextRehearsal.end_time
                  )} · ${nextRehearsal.location}`
                : "—"}
            </p>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase text-slate-400">Konzerte</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {concerts.map((concert) => (
                <li key={concert.id} className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {formatDate(concert.date)}
                  </span>{" "}
                  · {concert.time} · {concert.place}
                </li>
              ))}
              {concerts.length === 0 ? <li className="text-xs">—</li> : null}
            </ul>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase text-slate-400">Fortschritt</p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900 transition-all"
                style={{ width: `${Math.round(progressRatio * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {completedRehearsals} von {rehearsals.length} Proben durchgeführt
            </p>
          </div>
        </Card>
      </section>

      <section id="availability">
        <AvailabilityMatrix projects={project ? [project] : []} />
      </section>
    </div>
  );
}
