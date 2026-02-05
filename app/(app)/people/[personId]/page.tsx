import { notFound } from "next/navigation";
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

  const rehearsalIds = participations.flatMap((participation) =>
    (rehearsalsByProject[participation.project_id] ?? []).map(
      (item) => item.id
    )
  );

  const availabilitySummary = rehearsalIds.reduce(
    (acc, rehearsalId) => {
      const record = availability.find(
        (item) => item.rehearsal_id === rehearsalId && item.person_id === person.id
      );
      const status = record?.status ?? "unknown";
      acc[status] += 1;
      return acc;
    },
    { yes: 0, no: 0, unknown: 0 }
  );

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
          <div className="mt-4">
            <h4 className="text-xs uppercase text-slate-400">Erfahrung</h4>
            <p className="mt-1 text-sm text-slate-600">
              {experienceLabels[person.experience_level]}
            </p>
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

          <div className="mt-4">
            <h4 className="text-xs uppercase text-slate-400">Tags</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {person.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
                >
                  {tag}
                </span>
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
            {strings.people.availability}
          </h3>
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-sm text-slate-600">Zusammenfassung</p>
            <p className="mt-2 text-sm text-slate-500">
              <span className="font-semibold text-slate-800">
                {availabilitySummary.yes}
              </span>{" "}
              Ja ·{" "}
              <span className="font-semibold text-slate-800">
                {availabilitySummary.no}
              </span>{" "}
              Nein ·{" "}
              <span className="font-semibold text-slate-800">
                {availabilitySummary.unknown}
              </span>{" "}
              Offen
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
