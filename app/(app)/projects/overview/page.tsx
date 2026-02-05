import Link from "next/link";
import Card from "@/components/Card";
import { strings } from "@/lib/i18n";
import {
  concertsByProject,
  defaultChoirId,
  getMembership,
  projectParticipations,
  projects,
  rehearsalsByProject,
  type Voice
} from "@/lib/mockData";
import {
  formatDate,
  formatDateRange,
  formatTimeRange,
  formatWeekdays
} from "@/lib/format";

const voiceOrder: Voice[] = ["Soprano", "Alto", "Tenor", "Bass"];

const voiceColors: Record<Voice, string> = {
  Soprano: "var(--voice-soprano)",
  Alto: "var(--voice-alto)",
  Tenor: "var(--voice-tenor)",
  Bass: "var(--voice-bass)"
};

type ProjectStatusKey = "active" | "upcoming" | "archived";

const getProjectStatus = (
  project: (typeof projects)[number]
): { key: ProjectStatusKey; label: string; className: string } => {
  const today = new Date();
  const start = new Date(`${project.date_range.start}T00:00:00`);
  const end = new Date(`${project.date_range.end}T00:00:00`);

  if (today < start) {
    return {
      key: "upcoming",
      label: `${strings.projects.statusUpcoming} ${formatDate(
        project.date_range.start
      )}`,
      className: "border-slate-200 bg-slate-50 text-slate-600"
    };
  }
  if (today <= end) {
    return {
      key: "active",
      label: strings.projects.statusActive,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700"
    };
  }
  return {
    key: "archived",
    label: strings.projects.statusArchived,
    className: "border-slate-200 bg-slate-50 text-slate-500"
  };
};

export default function ProjectsOverviewPage() {
  const statusCounts = projects.reduce<Record<ProjectStatusKey, number>>(
    (acc, project) => {
      const status = getProjectStatus(project).key;
      acc[status] += 1;
      return acc;
    },
    { active: 0, upcoming: 0, archived: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            label: strings.projects.active,
            value: statusCounts.active,
            hint: strings.projects.overview
          },
          {
            label: strings.projects.upcoming,
            value: statusCounts.upcoming,
            hint: strings.projects.nextRehearsal
          },
          {
            label: strings.projects.archived,
            value: statusCounts.archived,
            hint: strings.projects.concerts
          }
        ].map((item) => (
          <Card key={item.label}>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              {item.hint}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900">
                {item.value}
              </span>
              <span className="text-sm text-slate-500">{item.label}</span>
            </div>
          </Card>
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {strings.projects.projectStatusLabel}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
          {strings.projects.active} · {statusCounts.active}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
          {strings.projects.upcoming} · {statusCounts.upcoming}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
          {strings.projects.archived} · {statusCounts.archived}
        </span>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => {
          const participants = projectParticipations.filter(
            (item) => item.project_id === project.id
          );
          const status = getProjectStatus(project);
          const rehearsalLabel = `${formatWeekdays(
            project.rehearsal_facts.weekdays
          )} · ${formatTimeRange(
            project.rehearsal_facts.start_time,
            project.rehearsal_facts.end_time
          )}`;
          const rehearsals = rehearsalsByProject[project.id] ?? [];
          const concerts = concertsByProject[project.id] ?? [];
          const nextRehearsal = rehearsals
            .filter(
              (rehearsal) =>
                new Date(`${rehearsal.date}T00:00:00`) >= new Date()
            )
            .sort(
              (a, b) =>
                new Date(`${a.date}T00:00:00`).getTime() -
                new Date(`${b.date}T00:00:00`).getTime()
            )[0];
          const nextConcert = concerts
            .filter(
              (concert) =>
                new Date(`${concert.date}T00:00:00`) >= new Date()
            )
            .sort(
              (a, b) =>
                new Date(`${a.date}T00:00:00`).getTime() -
                new Date(`${b.date}T00:00:00`).getTime()
            )[0];

          const voiceCounts = voiceOrder.reduce<Record<Voice, number>>(
            (acc, voice) => {
              acc[voice] = 0;
              return acc;
            },
            { Soprano: 0, Alto: 0, Tenor: 0, Bass: 0 }
          );

          participants.forEach((participant) => {
            const membership = getMembership(participant.person_id, defaultChoirId);
            if (membership) {
              voiceCounts[membership.voice] += 1;
            }
          });

          return (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="transition hover:border-slate-300">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {project.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {formatDateRange(
                        project.date_range.start,
                        project.date_range.end
                      )}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase text-slate-400">
                      {strings.projects.rehearsalRhythm}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {rehearsalLabel}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-400">
                      {strings.projects.location}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {project.rehearsal_facts.location}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                    {strings.projects.rehearsalsTotal} · {rehearsals.length}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                    {strings.projects.concertsTotal} · {concerts.length}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                    {strings.projects.participantsTotal} · {participants.length}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase text-slate-400">
                      {strings.projects.nextRehearsal}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
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
                      {strings.projects.nextConcert}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {nextConcert ? formatDate(nextConcert.date) : "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{strings.projects.participants}</span>
                  <div className="flex items-center gap-2">
                    {voiceOrder.map((voice) => (
                      <div key={voice} className="flex items-center gap-1">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: voiceColors[voice] }}
                        />
                        <span>{voiceCounts[voice]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
