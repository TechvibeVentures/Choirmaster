import Link from "next/link";
import Card from "@/components/Card";
import { strings } from "@/lib/i18n";
import {
  concertsByProject,
  extraEvents,
  projects,
  rehearsalsByProject
} from "@/lib/mockData";
import { formatDate } from "@/lib/format";

type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  subtitle?: string;
  type: "rehearsal" | "concert" | "extra";
  projectId?: string;
};

const getYear = () => new Date().getFullYear();

const getMonthName = (monthIndex: number, year: number) =>
  new Intl.DateTimeFormat("de-DE", { month: "long" }).format(
    new Date(year, monthIndex, 1)
  );

const formatDay = (isoDate: string) =>
  new Intl.DateTimeFormat("de-DE", { day: "2-digit" }).format(
    new Date(`${isoDate}T00:00:00`)
  );

const getEventLabel = (type: CalendarEvent["type"]) => {
  if (type === "rehearsal") return strings.calendar.eventRehearsal;
  if (type === "concert") return strings.calendar.eventConcert;
  return strings.calendar.eventExtra;
};

const getEventTone = (type: CalendarEvent["type"]) => {
  if (type === "rehearsal") return "border-slate-200 bg-slate-50 text-slate-600";
  if (type === "concert") return "border-slate-200 bg-slate-50 text-slate-600";
  return "border-slate-200 bg-slate-50 text-slate-600";
};

export default function CalendarPage() {
  const year = getYear();
  const events: CalendarEvent[] = [
    ...projects.flatMap((project) => {
      const rehearsals = rehearsalsByProject[project.id] ?? [];
      const concerts = concertsByProject[project.id] ?? [];
      return [
        ...rehearsals.map((rehearsal) => ({
          id: rehearsal.id,
          date: rehearsal.date,
          title: project.name,
          subtitle: `${strings.calendar.eventRehearsal} · ${rehearsal.location}`,
          type: "rehearsal" as const,
          projectId: project.id
        })),
        ...concerts.map((concert) => ({
          id: concert.id,
          date: concert.date,
          title: project.name,
          subtitle: `${strings.calendar.eventConcert} · ${concert.place}`,
          type: "concert" as const,
          projectId: project.id
        }))
      ];
    }),
    ...extraEvents.map((event) => ({
      id: event.id,
      date: event.date,
      title: event.title,
      subtitle: event.location,
      type: "extra" as const
    }))
  ].filter((event) => new Date(event.date).getFullYear() === year);

  const eventsByMonth = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthEvents = events
      .filter(
        (event) => new Date(`${event.date}T00:00:00`).getMonth() === monthIndex
      )
      .sort(
        (a, b) =>
          new Date(`${a.date}T00:00:00`).getTime() -
          new Date(`${b.date}T00:00:00`).getTime()
      );
    return { monthIndex, monthEvents };
  });

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-3 text-xs uppercase tracking-wide text-slate-400">
          {strings.calendar.projectsTitle}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} href={`/calendar/${project.id}`}>
              <Card className="transition hover:border-slate-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">
                    {project.name}
                  </h2>
                  <span className="text-xs text-slate-400">
                    {formatDate(project.date_range.start)} –{" "}
                    {formatDate(project.date_range.end)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {project.rehearsal_facts.location}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 text-xs uppercase tracking-wide text-slate-400">
          {strings.calendar.yearTitle} {year}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {eventsByMonth.map(({ monthIndex, monthEvents }) => (
            <Card key={monthIndex} className="flex h-full flex-col">
              <div className="text-sm font-semibold text-slate-900">
                {getMonthName(monthIndex, year)}
              </div>
              <div className="mt-3 flex-1 space-y-2">
                {monthEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-400">
                    Keine Termine
                  </div>
                ) : null}
                {monthEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs text-slate-600"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatDay(event.date)}.{monthIndex + 1}.
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${getEventTone(
                          event.type
                        )}`}
                      >
                        {getEventLabel(event.type)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      {event.projectId ? (
                        <Link
                          href={`/calendar/${event.projectId}`}
                          className="transition hover:text-slate-900"
                        >
                          {event.title}
                        </Link>
                      ) : (
                        event.title
                      )}
                    </div>
                    {event.subtitle ? (
                      <div className="mt-1 text-xs text-slate-500">
                        {event.subtitle}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
