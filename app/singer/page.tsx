import Card from "@/components/Card";
import { formatDate, formatDateRange, formatTimeRange, formatWeekdays } from "@/lib/format";
import { strings } from "@/lib/i18n";
import { getVoiceLabel } from "@/lib/labels";
import {
  choirs,
  concertPrograms,
  concertsByProject,
  defaultChoirId,
  memberships,
  people,
  projectParticipations,
  projects,
  rehearsalsByProject,
  type Voice
} from "@/lib/mockData";

const voiceColors: Record<Voice, string> = {
  Soprano: "var(--voice-soprano)",
  Alto: "var(--voice-alto)",
  Tenor: "var(--voice-tenor)",
  Bass: "var(--voice-bass)"
};

const getCurrentProject = (choirId: string) => {
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

const experienceLabels: Record<string, string> = {
  junior: "Einsteiger",
  regular: "Erfahren",
  advanced: "Fortgeschritten",
  professional: "Professionell"
};

const singerStatusLabels: Record<string, string> = {
  active: "aktiv",
  inactive: "inaktiv",
  project_only: "projektbezogen"
};

const inputStyles =
  "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none";

export default function SingerViewPage() {
  const mockSingerId = "nadia-frei";
  const singer = people.find((person) => person.id === mockSingerId) ?? people[0];
  const membership = memberships.find((item) => item.person_id === singer?.id);
  const choirId = membership?.choir_id ?? defaultChoirId;
  const choir = choirs.find((entry) => entry.id === choirId) ?? choirs[0];
  const project = getCurrentProject(choirId);
  const rehearsals = project ? rehearsalsByProject[project.id] ?? [] : [];
  const concerts = project ? concertsByProject[project.id] ?? [] : [];
  const upcomingRehearsals = rehearsals
    .filter((rehearsal) => new Date(`${rehearsal.date}T00:00:00`) >= new Date())
    .sort(
      (a, b) =>
        new Date(`${a.date}T00:00:00`).getTime() -
        new Date(`${b.date}T00:00:00`).getTime()
    )
    .slice(0, 3);
  const participation = project
    ? projectParticipations.find(
        (item) => item.project_id === project.id && item.person_id === singer?.id
      )
    : undefined;
  const program = project
    ? concertPrograms.find(
        (item) => item.project_id === project.id && item.choir_id === choirId
      )
    : undefined;
  const voice = membership?.voice;
  const voiceLabel = voice ? getVoiceLabel(voice) : "Stimme offen";
  const voiceColor = voice ? voiceColors[voice] : "#E2E8F0";
  const participationLabel = participation
    ? strings.singer.participationLabels[participation.invite_status]
    : strings.singer.participationLabels.invited;
  const singerStatusLabel = membership?.singer_status
    ? singerStatusLabels[membership.singer_status]
    : singerStatusLabels.active;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {strings.singer.title}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
              {singer?.first_name} {singer?.last_name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {choir?.name} · {choir?.city}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: voiceColor }}
            />
            <span>{voiceLabel}</span>
            <span className="text-slate-300">•</span>
            <span>{participationLabel}</span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
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
                  defaultValue={singer?.first_name}
                  type="text"
                />
              </label>
              <label className="text-sm text-slate-600">
                {strings.singer.fields.lastName}
                <input
                  className={inputStyles}
                  defaultValue={singer?.last_name}
                  type="text"
                />
              </label>
              <label className="text-sm text-slate-600 sm:col-span-2">
                {strings.singer.fields.email}
                <input
                  className={inputStyles}
                  defaultValue={singer?.email}
                  type="email"
                />
              </label>
              <label className="text-sm text-slate-600">
                {strings.singer.fields.phone}
                <input
                  className={inputStyles}
                  defaultValue={singer?.phone ?? ""}
                  type="tel"
                  placeholder="+41 79 000 00 00"
                />
              </label>
              <label className="text-sm text-slate-600">
                {strings.singer.fields.city}
                <input
                  className={inputStyles}
                  defaultValue={singer?.city}
                  type="text"
                />
              </label>
              <label className="text-sm text-slate-600">
                {strings.singer.fields.experience}
                <select className={inputStyles} defaultValue={singer?.experience_level}>
                  {Object.entries(experienceLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-600">
                {strings.singer.fields.tags}
                <input
                  className={inputStyles}
                  defaultValue={singer?.tags.join(", ")}
                  type="text"
                  placeholder="z.B. Intonation, Teamplay"
                />
              </label>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500 sm:col-span-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    {strings.singer.fields.voice}: {voiceLabel}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>
                    {strings.singer.fields.status}: {singerStatusLabel}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>
                    {strings.singer.fields.choir}: {choir?.name}
                  </span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  {strings.singer.save}
                </button>
              </div>
            </form>
          </Card>

          <div className="flex flex-col gap-6">
            <Card>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-slate-900">
                  {strings.singer.projectTitle}
                </h2>
                <p className="text-sm text-slate-500">
                  {strings.singer.projectSubtitle}
                </p>
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
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {strings.singer.sections.participation}
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {participationLabel}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {choir?.rehearsal_pattern.weekdays
                      ? `${formatWeekdays(choir.rehearsal_pattern.weekdays)} · ${formatTimeRange(
                          choir.rehearsal_pattern.start_time,
                          choir.rehearsal_pattern.end_time
                        )}`
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
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {strings.singer.sections.schedule}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {project
                      ? `${formatWeekdays(project.rehearsal_facts.weekdays)} · ${formatTimeRange(
                          project.rehearsal_facts.start_time,
                          project.rehearsal_facts.end_time
                        )}`
                      : ""}
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  {project?.rehearsal_facts.location}
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {strings.singer.sections.rehearsals}
                  </p>
                  <ul className="mt-3 space-y-3 text-sm text-slate-600">
                    {upcomingRehearsals.length ? (
                      upcomingRehearsals.map((rehearsal) => (
                        <li key={rehearsal.id} className="rounded-xl border border-slate-100 p-3">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatDate(rehearsal.date)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatTimeRange(rehearsal.start_time, rehearsal.end_time)} · {rehearsal.location}
                          </p>
                        </li>
                      ))
                    ) : (
                      <li className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                        Noch keine nächsten Proben geplant.
                      </li>
                    )}
                  </ul>
                </div>
                <div>
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
                <h3 className="text-base font-semibold text-slate-900">
                  {strings.singer.sections.program}
                </h3>
                <span className="text-xs text-slate-400">
                  {program?.season ?? ""}
                </span>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {(program?.pieces ?? []).slice(0, 6).map((piece) => (
                  <li key={piece.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{piece.title}</p>
                      <p className="text-xs text-slate-500">{piece.composer}</p>
                    </div>
                    <span className="text-xs text-slate-400">{piece.duration}</span>
                  </li>
                ))}
              </ul>
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
