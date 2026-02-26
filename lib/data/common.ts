import { DateTime } from "luxon";
import type {
  AdminProfile,
  Choir,
  ChoirMembership,
  Concert,
  ConcertProgram,
  Person,
  PersonSettings,
  ProgramPiece,
  Project,
  Rehearsal,
  Voice,
  Weekday
} from "@/lib/domain/types";

type JsonConcert = {
  date?: string;
  time?: string;
  place?: string;
};

const voiceSet = new Set<Voice>(["Soprano", "Alto", "Tenor", "Bass"]);
const experienceSet = new Set<Person["experience_level"]>([
  "junior",
  "regular",
  "advanced",
  "professional"
]);
const weekdaySet = new Set<Weekday>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

export const normalizeVoice = (input: string | null | undefined): Voice => {
  if (!input) return "Soprano";
  const normalized = `${input}`.trim();
  if (voiceSet.has(normalized as Voice)) return normalized as Voice;
  const lower = normalized.toLowerCase();
  if (lower === "sopran" || lower === "soprano") return "Soprano";
  if (lower === "alt" || lower === "alto") return "Alto";
  if (lower === "tenor") return "Tenor";
  if (lower === "bass" || lower === "basso") return "Bass";
  return "Soprano";
};

export const normalizeExperience = (
  input: string | null | undefined
): Person["experience_level"] => {
  if (!input) return "regular";
  const normalized = input.trim().toLowerCase();
  if (experienceSet.has(normalized as Person["experience_level"])) {
    return normalized as Person["experience_level"];
  }
  return "regular";
};

export const normalizeWeekdays = (days: string[] | null | undefined): Weekday[] => {
  if (!days?.length) return ["Tue"];
  const mapped = days
    .map((day) => day.trim())
    .filter((day): day is Weekday => weekdaySet.has(day as Weekday));
  return mapped.length ? mapped : ["Tue"];
};

export const normalizeChoirType = (
  value: string | null | undefined
): Choir["type"] => {
  if (value === "mixed" || value === "chamber" || value === "project") {
    return value;
  }
  return "mixed";
};

export const toLocalDateTimeParts = (
  iso: string,
  timezone: string
): { date: string; time: string; weekday: Weekday } => {
  const local = DateTime.fromISO(iso, { zone: "utc" }).setZone(timezone);
  const weekdayMap: Record<number, Weekday> = {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
    7: "Sun"
  };
  return {
    date: local.toISODate() || "1970-01-01",
    time: local.toFormat("HH:mm"),
    weekday: weekdayMap[local.weekday] || "Tue"
  };
};

export const convertProjectConcerts = (
  projectId: string,
  concertsJson: unknown
): Concert[] => {
  if (!Array.isArray(concertsJson)) return [];
  return concertsJson
    .map((item, index) => {
      const concert = item as JsonConcert;
      if (!concert?.date) return null;
      return {
        id: `${projectId}-concert-${index + 1}`,
        project_id: projectId,
        date: concert.date,
        time: concert.time || "",
        place: concert.place || ""
      } as Concert;
    })
    .filter((item): item is Concert => Boolean(item));
};

export const mapChoirRoleToProfileRole = (
  roles: string[]
): AdminProfile["role"] => {
  if (roles.includes("conductor")) return "conductor";
  if (roles.includes("chairman")) return "chair";
  return "manager";
};

export const mapMembershipRolesToAdminRole = (
  roles: string[]
): AdminProfile["choir_roles"][number]["role"] => {
  if (roles.includes("conductor")) return "Conductor";
  if (roles.includes("chairman")) return "Chair";
  return "Manager";
};

export const mapMembershipRolesToPeopleRoles = (roles: string[]) => {
  const personRoles = new Set<string>(["singer"]);
  if (roles.includes("conductor")) personRoles.add("conductor");
  if (roles.includes("chairman")) personRoles.add("chairman");
  if (roles.includes("manager")) personRoles.add("manager");
  return Array.from(personRoles);
};

export const normalizeSettings = (
  input: Partial<PersonSettings> | null | undefined,
  fallbackChoirId: string
): PersonSettings => {
  const prefs =
    (input?.notification_prefs || {}) as Partial<PersonSettings["notification_prefs"]>;
  return {
    person_id: input?.person_id || "",
    language: input?.language || "Deutsch",
    timezone: input?.timezone || "Europe/Zurich",
    notification_prefs: {
      digest: typeof prefs.digest === "boolean" ? prefs.digest : true,
      reminders: typeof prefs.reminders === "boolean" ? prefs.reminders : true,
      product_updates:
        typeof prefs.product_updates === "boolean" ? prefs.product_updates : false
    },
    session_days: input?.session_days ?? 90,
    mfa_enabled: input?.mfa_enabled ?? false,
    active_choir_id: input?.active_choir_id || fallbackChoirId
  };
};

export const mapRehearsalFacts = (
  rehearsals: Rehearsal[],
  fallbackWeekdays: Weekday[],
  fallbackStart: string,
  fallbackEnd: string,
  fallbackLocation: string
) => {
  if (!rehearsals.length) {
    return {
      weekdays: fallbackWeekdays,
      start_time: fallbackStart,
      end_time: fallbackEnd,
      location: fallbackLocation
    };
  }

  const weekdays = Array.from(new Set(rehearsals.map((item) => {
    const date = DateTime.fromISO(`${item.date}T00:00:00`, { zone: "utc" });
    const weekdayMap: Record<number, Weekday> = {
      1: "Mon",
      2: "Tue",
      3: "Wed",
      4: "Thu",
      5: "Fri",
      6: "Sat",
      7: "Sun"
    };
    return weekdayMap[date.weekday] || "Tue";
  })));

  const first = rehearsals[0];
  return {
    weekdays: weekdays.length ? weekdays : fallbackWeekdays,
    start_time: first.start_time || fallbackStart,
    end_time: first.end_time || fallbackEnd,
    location: first.location || fallbackLocation
  };
};

export const buildAdminProfile = (
  currentPerson: Person,
  settings: PersonSettings,
  choirMemberships: ChoirMembership[]
): AdminProfile => {
  const role = mapChoirRoleToProfileRole(choirMemberships.flatMap((item) => item.roles || []));
  const adminChoirMemberships = choirMemberships.filter((membership) => {
    const roles = membership.roles || [];
    return (
      roles.includes("chairman") || roles.includes("conductor") || roles.includes("manager")
    );
  });
  return {
    id: currentPerson.id,
    first_name: currentPerson.first_name,
    last_name: currentPerson.last_name,
    email: currentPerson.email,
    phone: currentPerson.phone,
    city: currentPerson.city,
    role,
    language: settings.language,
    timezone: settings.timezone,
    notification_prefs: settings.notification_prefs,
    session_days: settings.session_days,
    mfa_enabled: settings.mfa_enabled,
    choir_roles: adminChoirMemberships.map((membership) => {
      const roles = membership.roles || [];
      const isAdmin =
        roles.includes("chairman") || roles.includes("conductor") || roles.includes("manager");
      return {
        choir_id: membership.choir_id,
        role: mapMembershipRolesToAdminRole(roles),
        access: isAdmin ? "admin" : roles.includes("manager") ? "editor" : "viewer"
      };
    })
  };
};

export const safeTableMissing = (error: { code?: string } | null) =>
  Boolean(error?.code === "42P01" || error?.code === "42703");

export const mapProgramStatus = (status: string | null | undefined): ConcertProgram["status"] => {
  if (status === "current" || status === "archived" || status === "draft") return status;
  return "draft";
};

export const mapProgramPieces = (
  rows: Array<{
    id: string;
    title: string;
    composer: string;
    duration: string | null;
    pdf_url: string;
    recording_url: string;
    sort_order: number;
  }>
): ProgramPiece[] => {
  return rows
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      id: item.id,
      title: item.title,
      composer: item.composer,
      duration: item.duration || undefined,
      pdf_url: item.pdf_url,
      recording_url: item.recording_url
    }));
};
