export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export type Voice = "Soprano" | "Alto" | "Tenor" | "Bass";
export type VoiceDistribution = Record<Voice, [number, number, number]>;

export type Choir = {
  id: string;
  name: string;
  city: string;
  type: "mixed" | "chamber" | "project";
  genres: string[];
  voice_distribution: VoiceDistribution;
  rehearsal_pattern: {
    weekdays: Weekday[];
    start_time: string;
    end_time: string;
    default_location?: string;
  };
};

export type Person = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city: string;
  experience_level: "junior" | "regular" | "advanced" | "professional";
  tags: string[];
  roles: string[];
};

export type PersonSettings = {
  person_id: string;
  language: string;
  timezone: string;
  notification_prefs: {
    digest: boolean;
    reminders: boolean;
    product_updates: boolean;
  };
  session_days: number;
  mfa_enabled: boolean;
  active_choir_id?: string;
};

export type AdminProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city: string;
  role: "chair" | "conductor" | "manager";
  language: string;
  timezone: string;
  notification_prefs: {
    digest: boolean;
    reminders: boolean;
    product_updates: boolean;
  };
  session_days: number;
  mfa_enabled: boolean;
  choir_roles: {
    choir_id: string;
    role: "Chair" | "Conductor" | "Manager";
    access: "admin" | "editor" | "viewer";
  }[];
};

export type ChoirMembership = {
  person_id: string;
  choir_id: string;
  singer_status: "active" | "inactive" | "project_only";
  voice: Voice;
  roles?: string[];
};

export type Project = {
  id: string;
  choir_id: string;
  name: string;
  description?: string;
  link?: string;
  date_range: {
    start: string;
    end: string;
  };
  rehearsal_facts: {
    weekdays: Weekday[];
    start_time: string;
    end_time: string;
    location: string;
  };
};

export type ProjectParticipation = {
  project_id: string;
  person_id: string;
  invite_status: "invited" | "confirmed" | "declined";
};

export type Concert = {
  id: string;
  project_id: string;
  date: string;
  time: string;
  place: string;
};

export type Rehearsal = {
  id: string;
  project_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
};

export type Availability = {
  rehearsal_id: string;
  person_id: string;
  status: "yes" | "no" | "unknown";
};

export type RepertoirePiece = {
  id: string;
  choir_id: string;
  title: string;
  composer: string;
  era?: string;
};

export type ProgramPiece = {
  id: string;
  title: string;
  composer: string;
  duration?: string;
  pdf_url: string;
  recording_url: string;
};

export type ConcertProgram = {
  id: string;
  choir_id: string;
  project_id?: string;
  title: string;
  season: string;
  status: "current" | "archived" | "draft";
  pieces: ProgramPiece[];
};

export type DomainSnapshot = {
  current_person_id: string;
  choirs: Choir[];
  people: Person[];
  memberships: ChoirMembership[];
  projects: Project[];
  projectParticipations: ProjectParticipation[];
  concertsByProject: Record<string, Concert[]>;
  rehearsalsByProject: Record<string, Rehearsal[]>;
  availability: Availability[];
  repertoirePieces: RepertoirePiece[];
  concertPrograms: ConcertProgram[];
  adminProfile: AdminProfile;
  personSettings: PersonSettings;
  activeChoirId: string;
};
