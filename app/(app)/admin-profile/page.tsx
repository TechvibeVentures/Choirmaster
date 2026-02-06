import Card from "@/components/Card";
import { adminProfile, choirs, type AdminProfile } from "@/lib/mockData";
import { strings } from "@/lib/i18n";

const inputStyles =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/60";

const choirRoleLabels: Record<
  AdminProfile["choir_roles"][number]["role"],
  string
> = {
  Chair: "Vorstand",
  Conductor: "Leitung",
  Manager: "Organisation"
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
                {strings.profile.fields.language}
                <select className={inputStyles} defaultValue={adminProfile.language}>
                  <option value="Deutsch (CH)">Deutsch (CH)</option>
                  <option value="Deutsch (DE)">Deutsch (DE)</option>
                  <option value="English">English</option>
                </select>
              </label>
              <label className="text-sm text-slate-600 sm:col-span-2">
                {strings.profile.fields.password}
                <input
                  className={`${inputStyles} bg-slate-50 text-slate-500`}
                  defaultValue="********"
                  type="password"
                  readOnly
                />
              </label>
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
                  {strings.profile.actions.changePassword}
                </button>
              </div>
            </form>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
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
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                        {choirRoleLabels[entry.role]}
                      </span>
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300"
                      >
                        {strings.profile.actions.editChoir}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
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
      </div>
    </div>
  );
}
