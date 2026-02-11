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
  gridTemplateColumns: "repeat(31, minmax(24px, 1fr))"
};
const gridColsClass = "grid-cols-[140px_repeat(31,minmax(24px,1fr))]";

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
  const start = clampDate(getDateOnly(startIso), monthStart, monthEnd);
  const end = clampDate(getDateOnly(endIso), monthStart, monthEnd);
  if (end < monthStart || start > monthEnd) return null;
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
  if (type === "concert") return "bg-slate-900";
  if (type === "rehearsal") return "bg-slate-500";
  return "bg-amber-500";
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

  const projectTracks: ProjectTrack[] = projects.map((project) => ({
    id: project.id,
    name: project.name,
    start: project.date_range.start,
    end: project.date_range.end,
    events: [
      ...(rehearsalsByProject[project.id] ?? []).map((rehearsal) => ({
        date: rehearsal.date,
        type: "rehearsal" as const
      })),
      ...(concertsByProject[project.id] ?? []).map((concert) => ({
        date: concert.date,
        type: "concert" as const
      }))
    ],
    href: `/calendar/${project.id}`,
    tone: "project"
  }));

  const extraTrack: ProjectTrack = {
    id: "extra-events",
    name: strings.calendar.extraEvents,
    start: `${seasonStartYear}-08-01`,
    end: `${seasonStartYear + 1}-07-31`,
    events: extraEvents.map((event) => ({
      date: event.date,
      type: "extra" as const
    })),
    tone: "extra"
  };

  const tracks = [...projectTracks, extraTrack];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            {strings.calendar.yearTitle}
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            Saison {seasonLabel}
          </div>
        </div>
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
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {projectTracks.map((track) => (
            <Link
              key={track.id}
              href={track.href ?? "/calendar"}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 transition hover:border-slate-300 hover:text-slate-700"
            >
              <span className="h-2 w-2 rounded-full bg-slate-900/40" />
              {track.name}
            </Link>
          ))}
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            {strings.calendar.extraEvents}
          </span>
        </div>

        <div className="mt-5 w-full">
            <div className={`grid ${gridColsClass} items-center gap-y-2 text-xs text-slate-400`}>
              <div />
              <div className="grid" style={dayColumnsStyle}>
                {Array.from({ length: 31 }, (_, day) => (
                  <div key={day} className="text-center">
                    {day + 1}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-6">
              {months.map((month) => (
                <div key={`${month.year}-${month.monthIndex}`}>
                  <div className={`grid ${gridColsClass} items-center`}>
                    <div className="text-sm font-semibold text-slate-900 capitalize">
                      {month.label}
                    </div>
                    <div className="grid" style={dayColumnsStyle}>
                      {Array.from({ length: 31 }, (_, index) => (
                        <div
                          key={index}
                          className={`h-7 border border-slate-100 ${
                            index + 1 > month.daysInMonth
                              ? "bg-slate-50"
                              : "bg-white"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 space-y-2">
                    {tracks.map((track) => {
                      const bar = getBarSegment(track.start, track.end, month);
                      const events = track.events.filter((event) =>
                        isDateInMonth(event.date, month)
                      );
                      return (
                        <div
                          key={`${month.year}-${month.monthIndex}-${track.id}`}
                          className={`grid ${gridColsClass} items-center`}
                        >
                          <div />
                          <div className="grid" style={dayColumnsStyle}>
                            {bar ? (
                              track.href ? (
                                <Link
                                  href={track.href}
                                  className={`relative h-5 rounded-full ${
                                    track.tone === "project"
                                      ? "bg-slate-900/10"
                                      : "bg-amber-100"
                                  } transition hover:bg-slate-900/20`}
                                  style={{
                                    gridColumn: `${bar.startDay} / ${bar.endDay + 1}`
                                  }}
                                  aria-label={`${track.name} öffnen`}
                                >
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-700">
                                    {track.name}
                                  </span>
                                  {events.map((event, index) => {
                                    const day = getDateOnly(event.date).getDate();
                                    const position =
                                      month.daysInMonth > 1
                                        ? ((day - 1) / (month.daysInMonth - 1)) * 100
                                        : 0;
                                    return (
                                      <span
                                        key={`${event.type}-${event.date}-${index}`}
                                        className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${getDotColor(
                                          event.type
                                        )}`}
                                        style={{ left: `${position}%` }}
                                      />
                                    );
                                  })}
                                </Link>
                              ) : (
                                <div
                                  className={`relative h-5 rounded-full ${
                                    track.tone === "project"
                                      ? "bg-slate-900/10"
                                      : "bg-amber-100"
                                  }`}
                                  style={{
                                    gridColumn: `${bar.startDay} / ${bar.endDay + 1}`
                                  }}
                                >
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-700">
                                    {track.name}
                                  </span>
                                  {events.map((event, index) => {
                                    const day = getDateOnly(event.date).getDate();
                                    const position =
                                      month.daysInMonth > 1
                                        ? ((day - 1) / (month.daysInMonth - 1)) * 100
                                        : 0;
                                    return (
                                      <span
                                        key={`${event.type}-${event.date}-${index}`}
                                        className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${getDotColor(
                                          event.type
                                        )}`}
                                        style={{ left: `${position}%` }}
                                      />
                                    );
                                  })}
                                </div>
                              )
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
        </div>
      </section>
    </div>
  );
}
