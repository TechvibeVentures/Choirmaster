import Card from "@/components/Card";
import { adminProfile, choirs } from "@/lib/mockData";
import { strings } from "@/lib/i18n";

const inputStyles =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/60";

const toggleStyles =
  "h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-200/60";

const roleLabels: Record<typeof adminProfile.role, string> = {
  chair: "Vorstand",
  conductor: "Leitung",
  manager: "Organisation"
};

export default function ProfilePage() {
  const choirCards = adminProfile.choir_roles.map((entry) => {
    const choir = choirs.find((item) => item.id === entry.choir_id);
    return {
      ...entry,
      choirName: choir?.name ?? "Ensemble",
      city: choir?.city ?? "",
      rehearsal: choir?.rehearsal_pattern
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-slate-400">
          {strings.profile.title}
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">
          {strings.profile.title}
        </h2>
        <p className="max-w-2xl text-sm text-slate-500">
          {strings.profile.subtitle}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-slate-900">
                {strings.profile.basicsTitle}
              </h3>
              <p className="text-sm text-slate-500">
                {strings.profile.basicsSubtitle}
              </p>
            </div>
            <form className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-600">
                {strings.profile.fields.firstName}
                <input
                  className={inputStyles}
                  defaultValue={adminProfile.first_name}
                  type="text"
                />
              </label>
              <label className="text-sm text-slate-600">
                {strings.profile.fields.lastName}
                <input
                  className={inputStyles}
                  defaultValue={adminProfile.last_name}
                  type="text"
                />
              </label>
              <label className="text-sm text-slate-600 sm:col-span-2">
                {strings.profile.fields.email}
                <input
                  className={inputStyles}
                  defaultValue={adminProfile.email}
                  type="email"
                />
              </label>
              <label className="text-sm text-slate-600">
                {strings.profile.fields.phone}
                <input
                  className={inputStyles}
                  defaultValue={adminProfile.phone ?? ""}
                  type="tel"
                />
              </label>
              <label className="text-sm text-slate-600">
                {strings.profile.fields.city}
                <input
                  className={inputStyles}
                  defaultValue={adminProfile.city}
                  type="text"
                />
              </label>
              <label className="text-sm text-slate-600 sm:col-span-2">
                {strings.profile.fields.role}
                <input
                  className={`${inputStyles} bg-slate-50 text-slate-500`}
                  defaultValue={roleLabels[adminProfile.role]}
                  type="text"
                  readOnly
                />
              </label>
              <div className="sm:col-span-2 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span>Admin-Zugriff aktiviert</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Aktiv
                </span>
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
                >
                  {strings.profile.actions.save}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-slate-300"
                >
                  {strings.profile.actions.manageRoles}
                </button>
              </div>
            </form>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {strings.profile.choirTitle}
                </h3>
                <p className="text-sm text-slate-500">
                  {strings.profile.choirSubtitle}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300"
              >
                {strings.profile.actions.addChoir}
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              {choirCards.map((entry) => (
                <div
                  key={entry.choir_id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {entry.choirName}
                      </p>
                      <p className="text-xs text-slate-500">{entry.city}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                      {entry.role}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                    <div>
                      Zugriff
                      <p className="text-sm text-slate-700">{entry.access}</p>
                    </div>
                    <div>
                      Probe
                      <p className="text-sm text-slate-700">
                        {entry.rehearsal?.weekdays.join(", ")} ·{" "}
                        {entry.rehearsal?.start_time}–{entry.rehearsal?.end_time}
                      </p>
                    </div>
                    <div>
                      Ort
                      <p className="text-sm text-slate-700">
                        {entry.rehearsal?.default_location ?? "Noch offen"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-slate-900">
                {strings.profile.settingsTitle}
              </h3>
              <p className="text-sm text-slate-500">
                {strings.profile.settingsSubtitle}
              </p>
            </div>
            <div className="mt-6 grid gap-4">
              <label className="text-sm text-slate-600">
                {strings.profile.fields.language}
                <input
                  className={inputStyles}
                  defaultValue={adminProfile.language}
                  type="text"
                />
              </label>
              <label className="text-sm text-slate-600">
                {strings.profile.fields.timezone}
                <input
                  className={inputStyles}
                  defaultValue={adminProfile.timezone}
                  type="text"
                />
              </label>
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-700">Benachrichtigungen</p>
                <label className="flex items-center justify-between">
                  {strings.profile.fields.digest}
                  <input
                    className={toggleStyles}
                    defaultChecked={adminProfile.notification_prefs.digest}
                    type="checkbox"
                  />
                </label>
                <label className="flex items-center justify-between">
                  {strings.profile.fields.reminders}
                  <input
                    className={toggleStyles}
                    defaultChecked={adminProfile.notification_prefs.reminders}
                    type="checkbox"
                  />
                </label>
                <label className="flex items-center justify-between">
                  {strings.profile.fields.updates}
                  <input
                    className={toggleStyles}
                    defaultChecked={adminProfile.notification_prefs.product_updates}
                    type="checkbox"
                  />
                </label>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-slate-900">
                {strings.profile.securityTitle}
              </h3>
              <p className="text-sm text-slate-500">
                {strings.profile.securitySubtitle}
              </p>
            </div>
            <div className="mt-6 grid gap-4 text-sm text-slate-600">
              <label>
                {strings.profile.fields.session}
                <input
                  className={inputStyles}
                  defaultValue={`${adminProfile.session_days} Tage`}
                  type="text"
                  readOnly
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                {strings.profile.fields.mfa}
                <span className="text-xs font-medium text-slate-500">
                  {adminProfile.mfa_enabled ? "Aktiv" : "Optional"}
                </span>
              </label>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-slate-300"
              >
                Sicherheitseinstellungen öffnen
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
