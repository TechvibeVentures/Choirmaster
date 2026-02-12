import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { strings } from "@/lib/i18n";
import {
  concertsByProject,
  extraEvents,
  projects,
  rehearsalsByProject
} from "@/lib/mockData";

type SeasonMonth = {
  year: number;
  monthIndex: number;
  label: string;
  daysInMonth: number;
};

type ProjectEvent = {
  date: string;
  type: "rehearsal" | "concert" | "extra";
  label: string;
};

type ProjectTrack = {
  id: string;
  name: string;
  start: string;
  end: string;
  events: ProjectEvent[];
  href?: string;
  tone: "project" | "extra";
};

const dayColumnsStyle = {
  gridTemplateColumns: "repeat(37, minmax(0, 1fr))"
};
const gridColumnsStyle = {
  gridTemplateColumns: "140px 1fr"
};

const getSeasonStartYear = (today: Date) =>
  today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;

const buildSeasonMonths = (startYear: number): SeasonMonth[] => {
  const months: SeasonMonth[] = [];
  for (let i = 0; i < 12; i += 1) {
    const monthIndex = (7 + i) % 12;
    const year = monthIndex >= 7 ? startYear : startYear + 1;
    const label = new Intl.DateTimeFormat("de-DE", { month: "long" }).format(
      new Date(year, monthIndex, 1)
    );
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    months.push({ year, monthIndex, label, daysInMonth });
  }
  return months;
};

const getDateOnly = (iso: string) => new Date(`${iso}T00:00:00`);

const clampDate = (value: Date, min: Date, max: Date) =>
  value < min ? min : value > max ? max : value;

const getBarSegment = (
  startIso: string,
  endIso: string,
  month: SeasonMonth
) => {
  const monthStart = new Date(month.year, month.monthIndex, 1);
  const monthEnd = new Date(month.year, month.monthIndex + 1, 0);
  const rawStart = getDateOnly(startIso);
  const rawEnd = getDateOnly(endIso);
  if (rawEnd < monthStart || rawStart > monthEnd) return null;
  const start = clampDate(rawStart, monthStart, monthEnd);
  const end = clampDate(rawEnd, monthStart, monthEnd);
  return {
    startDay: start.getDate(),
    endDay: end.getDate()
  };
};

const isDateInMonth = (iso: string, month: SeasonMonth) => {
  const date = getDateOnly(iso);
  return (
    date.getFullYear() === month.year && date.getMonth() === month.monthIndex
  );
};

const getDotColor = (type: ProjectEvent["type"]) => {
  if (type === "concert") return "bg-blue-500";
  if (type === "rehearsal") return "bg-slate-500";
  return "bg-amber-500";
};

const abbreviateLabel = (label: string) => {
  if (label.length <= 8) return label;
  return `${label.slice(0, 7)}…`;
};

const weekdayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const getWeekdayOffset = (month: SeasonMonth) => {
  const jsDay = new Date(month.year, month.monthIndex, 1).getDay(); // 0=Sun
  const mondayIndex = (jsDay + 6) % 7; // 0=Mon
  return mondayIndex;
};

export default function CalendarPage({
  searchParams
}: {
  searchParams?: { season?: string };
}) {
  const today = new Date();
  const seasonStartYear = searchParams?.season
    ? Number(searchParams.season)
    : getSeasonStartYear(today);
  const months = buildSeasonMonths(seasonStartYear);
  const seasonLabel = `${seasonStartYear}/${String(seasonStartYear + 1).slice(
    -2
  )}`;

  const projectTracks: ProjectTrack[] = projects.map((project) => {
    const events = [
      ...(rehearsalsByProject[project.id] ?? []).map((rehearsal) => ({
        date: rehearsal.date,
        type: "rehearsal" as const,
        label: "Probe"
      })),
      ...(concertsByProject[project.id] ?? []).map((concert) => ({
        date: concert.date,
        type: "concert" as const,
        label: "Konzert"
      }))
    ];
    const eventDates = events.map((event) => event.date).sort();
    const start = eventDates[0] ?? project.date_range.start;
    const end = eventDates[eventDates.length - 1] ?? project.date_range.end;
    return {
      id: project.id,
      name: project.name,
      start,
      end,
      events,
      href: `/calendar/${project.id}`,
      tone: "project"
    };
  });

  const assignExtraEvents = (events: typeof extraEvents) => {
    events.forEach((event) => {
      const date = getDateOnly(event.date);
      const target =
        projectTracks.find((project) => {
          const start = getDateOnly(project.start);
          const end = getDateOnly(project.end);
          return date >= start && date <= end;
        }) ?? projectTracks[0];
      if (!target) return;
      target.events.push({
        date: event.date,
        type: "extra" as const,
        label: event.title
      });
    });
  };

  assignExtraEvents(extraEvents);

  const tracks = projectTracks;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/calendar?season=${seasonStartYear - 1}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              aria-label="Vorherige Saison"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              href={`/calendar?season=${seasonStartYear + 1}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              aria-label="Nächste Saison"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              {strings.calendar.yearTitle}
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              Saison {seasonLabel}
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled
          className="whitespace-nowrap rounded-xl border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm"
          title="Diese Funktion kommt in einer späteren Version der App."
        >
          {strings.projects.newProject}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
        <div className="w-full">
          <div
            className="grid w-full items-center gap-y-2 text-xs text-slate-400"
            style={gridColumnsStyle}
          >
            <div />
            <div className="grid w-full" style={dayColumnsStyle}>
              {Array.from({ length: 37 }, (_, index) => (
                <div key={index} className="text-center">
                  {weekdayLabels[index % 7]}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 space-y-2">
            {months.map((month) => (
              <div key={`${month.year}-${month.monthIndex}`}>
                <div className="grid w-full items-center" style={gridColumnsStyle}>
                  <div className="text-sm font-semibold text-slate-900 capitalize">
                    {month.label}
                  </div>
                  <div className="relative">
                    <div className="grid w-full" style={dayColumnsStyle}>
                      {Array.from({ length: 37 }, (_, index) => (
                        <div
                          key={index}
                          className={`relative h-12 border border-slate-100 ${
                            index + 1 <= getWeekdayOffset(month) ||
                            index + 1 > month.daysInMonth + getWeekdayOffset(month)
                              ? "bg-slate-50"
                              : "bg-white"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="pointer-events-none absolute inset-0 flex flex-col gap-2 px-1 py-2">
                      <div className="grid w-full" style={dayColumnsStyle}>
                        {Array.from({ length: month.daysInMonth }, (_, dayIndex) => {
                          const day = dayIndex + 1;
                          const start = day + getWeekdayOffset(month);
                          return (
                            <div
                              key={`day-${month.year}-${month.monthIndex}-${day}`}
                              className="relative h-12 text-[10px] text-slate-400"
                              style={{ gridColumnStart: start }}
                            >
                              <span className="absolute right-1 top-0">
                                {day}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pointer-events-auto mt-1 space-y-2">
                      {tracks.map((track) => {
                        const bar = getBarSegment(track.start, track.end, month);
                        const events = track.events.filter((event) =>
                          isDateInMonth(event.date, month)
                        );
                        const barBaseClass =
                          track.tone === "project"
                            ? "bg-slate-900/10"
                            : "bg-amber-100";
                        const rawStart = getDateOnly(track.start);
                        const rawEnd = getDateOnly(track.end);
                        const monthStart = new Date(month.year, month.monthIndex, 1);
                        const monthEnd = new Date(month.year, month.monthIndex + 1, 0);
                        const trimmedLeft = rawStart < monthStart;
                        const trimmedRight = rawEnd > monthEnd;
                        const offset = getWeekdayOffset(month);
                        const adjustedStartDay = trimmedLeft ? 1 : bar?.startDay ?? 1;
                        const startCol = trimmedLeft
                          ? 1
                          : adjustedStartDay + offset;
                        const endCol = trimmedLeft
                          ? (bar?.endDay ?? 1) + offset + 1
                          : (bar?.endDay ?? 1) + offset + 1;
                        return (
                          <div key={`${month.year}-${month.monthIndex}-${track.id}`}>
                            <div className="grid w-full" style={dayColumnsStyle}>
                              {bar ? (
                                track.href ? (
                                  <Link
                                    href={track.href}
                                    className={`relative z-10 h-7 border border-slate-200 ${barBaseClass} shadow-sm transition hover:border-slate-300 ${
                                      trimmedLeft
                                        ? "rounded-r-full"
                                        : trimmedRight
                                          ? "rounded-l-full"
                                          : "rounded-full"
                                    }`}
                                    style={{
                                      gridColumn: `${startCol} / ${endCol}`
                                    }}
                                    aria-label={`${track.name} öffnen`}
                                  >
                                    {events.map((event, index) => {
                                      const day = getDateOnly(event.date).getDate();
                                      const col = day + offset;
                                      const position =
                                        month.daysInMonth > 1
                                          ? ((col - 1) / 36) * 100
                                          : 0;
                                      return (
                                        <span
                                          key={`${event.type}-${event.date}-${index}`}
                                          className="absolute top-1/2 flex -translate-y-1/2 items-center gap-1 text-[10px] text-slate-500"
                                          style={{ left: `${position}%` }}
                                        >
                                          <span
                                            className={`h-2 w-2 rounded-full ${getDotColor(
                                              event.type
                                            )}`}
                                          />
                                          <span className="max-w-[64px] truncate">
                                            {event.label.length > 8
                                              ? abbreviateLabel(event.label)
                                              : event.label}
                                          </span>
                                        </span>
                                      );
                                    })}
                                  </Link>
                                ) : (
                                  <div
                                    className={`relative z-10 h-7 border border-slate-200 ${barBaseClass} shadow-sm ${
                                      trimmedLeft
                                        ? "rounded-r-full"
                                        : trimmedRight
                                          ? "rounded-l-full"
                                          : "rounded-full"
                                    }`}
                                    style={{
                                      gridColumn: `${startCol} / ${endCol}`
                                    }}
                                  >
                                    {events.map((event, index) => {
                                      const day = getDateOnly(event.date).getDate();
                                      const col = day + offset;
                                      const position =
                                        month.daysInMonth > 1
                                          ? ((col - 1) / 36) * 100
                                          : 0;
                                      return (
                                        <span
                                          key={`${event.type}-${event.date}-${index}`}
                                          className="absolute top-1/2 flex -translate-y-1/2 items-center gap-1 text-[10px] text-slate-500"
                                          style={{ left: `${position}%` }}
                                        >
                                          <span
                                            className={`h-2 w-2 rounded-full ${getDotColor(
                                              event.type
                                            )}`}
                                          />
                                          <span className="max-w-[64px] truncate">
                                            {event.label.length > 8
                                              ? abbreviateLabel(event.label)
                                              : event.label}
                                          </span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                )
                              ) : null}
                            </div>
                            {bar && !trimmedLeft ? (
                              <div className="mt-1 grid w-full" style={dayColumnsStyle}>
                                <div
                                  className="text-[10px] font-semibold text-slate-600"
                                  style={{ gridColumnStart: startCol }}
                                >
                                  {track.name}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
