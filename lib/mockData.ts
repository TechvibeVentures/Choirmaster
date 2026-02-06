export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export type Voice = "Soprano" | "Alto" | "Tenor" | "Bass";

export type Choir = {
  id: string;
  name: string;
  city: string;
  type: "mixed" | "chamber" | "project";
  genres: string[];
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

export const choirs: Choir[] = [
  {
    id: "luzia-chor",
    name: "Luzia Chor",
    city: "Zürich",
    type: "mixed",
    genres: ["Klassik", "Keltisch", "Geistlich"],
    rehearsal_pattern: {
      weekdays: ["Tue"],
      start_time: "19:30",
      end_time: "21:30",
      default_location: "Pfrundhaus, Zürich"
    }
  }
];

export const people: Person[] = [
  {
    id: "lisa-may-appenzeller",
    first_name: "Lisa May",
    last_name: "Appenzeller",
    email: "lisa.appenzeller@example.com",
    phone: "+41 79 555 12 12",
    city: "Zürich",
    experience_level: "professional",
    tags: ["Leitung", "Präzision"],
    roles: ["singer", "conductor"]
  },
  {
    id: "lara-baumann",
    first_name: "Lara",
    last_name: "Baumann",
    email: "lara.baumann@example.com",
    city: "Winterthur",
    experience_level: "regular",
    tags: ["Klangfarbe"],
    roles: ["singer"]
  },
  {
    id: "mirjam-keller",
    first_name: "Mirjam",
    last_name: "Keller",
    email: "mirjam.keller@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Intonation"],
    roles: ["singer"]
  },
  {
    id: "nadia-frei",
    first_name: "Nadia",
    last_name: "Frei",
    email: "nadia.frei@example.com",
    city: "Uster",
    experience_level: "junior",
    tags: ["Neuzugang"],
    roles: ["singer"]
  },
  {
    id: "sarah-meier",
    first_name: "Sarah",
    last_name: "Meier",
    email: "sarah.meier@example.com",
    city: "Zürich",
    experience_level: "advanced",
    tags: ["Stimmführung"],
    roles: ["singer"]
  },
  {
    id: "elena-hug",
    first_name: "Elena",
    last_name: "Hug",
    email: "elena.hug@example.com",
    city: "Baden",
    experience_level: "regular",
    tags: ["Ensemble"],
    roles: ["singer"]
  },
  {
    id: "rahel-bieri",
    first_name: "Rahel",
    last_name: "Bieri",
    email: "rahel.bieri@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Leise Passagen"],
    roles: ["singer"]
  },
  {
    id: "hanna-graf",
    first_name: "Hanna",
    last_name: "Graf",
    email: "hanna.graf@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Teamplay"],
    roles: ["singer"]
  },
  {
    id: "claudia-buehler",
    first_name: "Claudia",
    last_name: "Bühler",
    email: "claudia.bühler@example.com",
    city: "Zürich",
    experience_level: "advanced",
    tags: ["Stimmführung"],
    roles: ["singer", "chairman"]
  },
  {
    id: "miriam-koch",
    first_name: "Miriam",
    last_name: "Koch",
    email: "miriam.koch@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Konzentration"],
    roles: ["singer"]
  },
  {
    id: "nora-eichenberger",
    first_name: "Nora",
    last_name: "Eichenberger",
    email: "nora.eichenberger@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Rhythmus"],
    roles: ["singer"]
  },
  {
    id: "tanja-fehr",
    first_name: "Tanja",
    last_name: "Fehr",
    email: "tanja.fehr@example.com",
    city: "Winterthur",
    experience_level: "regular",
    tags: ["Klangbalance"],
    roles: ["singer"]
  },
  {
    id: "sabine-roth",
    first_name: "Sabine",
    last_name: "Roth",
    email: "sabine.roth@example.com",
    city: "Zürich",
    experience_level: "advanced",
    tags: ["Stabil"],
    roles: ["singer"]
  },
  {
    id: "lea-schmid",
    first_name: "Lea",
    last_name: "Schmid",
    email: "lea.schmid@example.com",
    city: "Zürich",
    experience_level: "junior",
    tags: ["Motiviert"],
    roles: ["singer"]
  },
  {
    id: "isabel-wyss",
    first_name: "Isabel",
    last_name: "Wyss",
    email: "isabel.wyss@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Klangfarbe"],
    roles: ["singer"]
  },
  {
    id: "jasmin-suter",
    first_name: "Jasmin",
    last_name: "Suter",
    email: "jasmin.suter@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Stimmführung"],
    roles: ["singer"]
  },
  {
    id: "benjamin-zwicky",
    first_name: "Benjamin",
    last_name: "Zwicky",
    email: "benjamin.zwicky@example.com",
    city: "Zürich",
    experience_level: "advanced",
    tags: ["Leitung", "Präzision"],
    roles: ["singer", "conductor"]
  },
  {
    id: "david-christen",
    first_name: "David",
    last_name: "Christen",
    email: "david.christen@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Intonation"],
    roles: ["singer"]
  },
  {
    id: "tobias-kunz",
    first_name: "Tobias",
    last_name: "Kunz",
    email: "tobias.kunz@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Pünktlich"],
    roles: ["singer"]
  },
  {
    id: "markus-steiner",
    first_name: "Markus",
    last_name: "Steiner",
    email: "markus.steiner@example.com",
    city: "Zürich",
    experience_level: "advanced",
    tags: ["Präzision"],
    roles: ["singer"]
  },
  {
    id: "simon-odermatt",
    first_name: "Simon",
    last_name: "Odermatt",
    email: "simon.odermatt@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Klang"],
    roles: ["singer"]
  },
  {
    id: "jonas-vogel",
    first_name: "Jonas",
    last_name: "Vogel",
    email: "jonas.vogel@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Ensemble"],
    roles: ["singer"]
  },
  {
    id: "philipp-aebi",
    first_name: "Philipp",
    last_name: "Äbi",
    email: "philipp.äbi@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Rhythmus"],
    roles: ["singer"]
  },
  {
    id: "adrian-lutz",
    first_name: "Adrian",
    last_name: "Lutz",
    email: "adrian.lutz@example.com",
    city: "Zürich",
    experience_level: "junior",
    tags: ["Motiviert"],
    roles: ["singer"]
  },
  {
    id: "lukas-wenger",
    first_name: "Lukas",
    last_name: "Wenger",
    email: "lukas.wenger@example.com",
    city: "Zürich",
    experience_level: "advanced",
    tags: ["Stimmführung"],
    roles: ["singer"]
  },
  {
    id: "michael-baer",
    first_name: "Michael",
    last_name: "Bär",
    email: "michael.bär@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Teamplay"],
    roles: ["singer"]
  },
  {
    id: "stefan-moser",
    first_name: "Stefan",
    last_name: "Moser",
    email: "stefan.moser@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Klang"],
    roles: ["singer"]
  },
  {
    id: "daniel-huber",
    first_name: "Daniel",
    last_name: "Huber",
    email: "daniel.huber@example.com",
    city: "Zürich",
    experience_level: "advanced",
    tags: ["Präzision"],
    roles: ["singer"]
  },
  {
    id: "thomas-gloor",
    first_name: "Thomas",
    last_name: "Gloor",
    email: "thomas.gloor@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Intonation"],
    roles: ["singer"]
  },
  {
    id: "pascal-frei",
    first_name: "Pascal",
    last_name: "Frei",
    email: "pascal.frei@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Zuverlässig"],
    roles: ["singer"]
  },
  {
    id: "roman-keller",
    first_name: "Roman",
    last_name: "Keller",
    email: "roman.keller@example.com",
    city: "Zürich",
    experience_level: "regular",
    tags: ["Klangfarbe"],
    roles: ["singer"]
  },
  {
    id: "yannic-graf",
    first_name: "Yannic",
    last_name: "Graf",
    email: "yannic.graf@example.com",
    city: "Zürich",
    experience_level: "junior",
    tags: ["Motiviert"],
    roles: ["singer"]
  }
];

export const adminProfile: AdminProfile = {
  id: "lisa-may-appenzeller",
  first_name: "Lisa May",
  last_name: "Appenzeller",
  email: "lisa.appenzeller@example.com",
  phone: "+41 79 555 12 12",
  city: "Zürich",
  role: "conductor",
  language: "Deutsch (CH)",
  timezone: "Europe/Zurich",
  notification_prefs: {
    digest: true,
    reminders: true,
    product_updates: false
  },
  session_days: 90,
  mfa_enabled: false,
  choir_roles: [
    {
      choir_id: "luzia-chor",
      role: "Conductor",
      access: "admin"
    }
  ]
};

export const memberships: ChoirMembership[] = [
  { person_id: "lisa-may-appenzeller", choir_id: "luzia-chor", singer_status: "active", voice: "Soprano" },
  { person_id: "lara-baumann", choir_id: "luzia-chor", singer_status: "active", voice: "Soprano" },
  { person_id: "mirjam-keller", choir_id: "luzia-chor", singer_status: "active", voice: "Soprano" },
  { person_id: "nadia-frei", choir_id: "luzia-chor", singer_status: "active", voice: "Soprano" },
  { person_id: "sarah-meier", choir_id: "luzia-chor", singer_status: "active", voice: "Soprano" },
  { person_id: "elena-hug", choir_id: "luzia-chor", singer_status: "active", voice: "Soprano" },
  { person_id: "rahel-bieri", choir_id: "luzia-chor", singer_status: "active", voice: "Soprano" },
  { person_id: "hanna-graf", choir_id: "luzia-chor", singer_status: "active", voice: "Soprano" },
  { person_id: "claudia-buehler", choir_id: "luzia-chor", singer_status: "active", voice: "Alto" },
  { person_id: "miriam-koch", choir_id: "luzia-chor", singer_status: "active", voice: "Alto" },
  { person_id: "nora-eichenberger", choir_id: "luzia-chor", singer_status: "active", voice: "Alto" },
  { person_id: "tanja-fehr", choir_id: "luzia-chor", singer_status: "active", voice: "Alto" },
  { person_id: "sabine-roth", choir_id: "luzia-chor", singer_status: "active", voice: "Alto" },
  { person_id: "lea-schmid", choir_id: "luzia-chor", singer_status: "active", voice: "Alto" },
  { person_id: "isabel-wyss", choir_id: "luzia-chor", singer_status: "active", voice: "Alto" },
  { person_id: "jasmin-suter", choir_id: "luzia-chor", singer_status: "active", voice: "Alto" },
  { person_id: "benjamin-zwicky", choir_id: "luzia-chor", singer_status: "active", voice: "Tenor" },
  { person_id: "david-christen", choir_id: "luzia-chor", singer_status: "active", voice: "Tenor" },
  { person_id: "tobias-kunz", choir_id: "luzia-chor", singer_status: "active", voice: "Tenor" },
  { person_id: "markus-steiner", choir_id: "luzia-chor", singer_status: "active", voice: "Tenor" },
  { person_id: "simon-odermatt", choir_id: "luzia-chor", singer_status: "active", voice: "Tenor" },
  { person_id: "jonas-vogel", choir_id: "luzia-chor", singer_status: "active", voice: "Tenor" },
  { person_id: "philipp-aebi", choir_id: "luzia-chor", singer_status: "active", voice: "Tenor" },
  { person_id: "adrian-lutz", choir_id: "luzia-chor", singer_status: "active", voice: "Tenor" },
  { person_id: "lukas-wenger", choir_id: "luzia-chor", singer_status: "active", voice: "Bass" },
  { person_id: "michael-baer", choir_id: "luzia-chor", singer_status: "active", voice: "Bass" },
  { person_id: "stefan-moser", choir_id: "luzia-chor", singer_status: "active", voice: "Bass" },
  { person_id: "daniel-huber", choir_id: "luzia-chor", singer_status: "active", voice: "Bass" },
  { person_id: "thomas-gloor", choir_id: "luzia-chor", singer_status: "active", voice: "Bass" },
  { person_id: "pascal-frei", choir_id: "luzia-chor", singer_status: "active", voice: "Bass" },
  { person_id: "roman-keller", choir_id: "luzia-chor", singer_status: "active", voice: "Bass" },
  { person_id: "yannic-graf", choir_id: "luzia-chor", singer_status: "active", voice: "Bass" }
];

export const projects: Project[] = [
  {
    id: "british-isles",
    choir_id: "luzia-chor",
    name: "British Isles",
    description:
      "Mystische Melodien und mitreißende Rhythmen der Britischen Inseln. Das Programm umfasst traditionelle keltische Musik und englische Chorstücke von der Renaissance bis zur Moderne.",
    date_range: {
      start: "2026-03-03",
      end: "2026-05-03"
    },
    rehearsal_facts: {
      weekdays: ["Tue"],
      start_time: "19:30",
      end_time: "21:30",
      location: "Pfrundhaus, Zürich"
    }
  }
];

export const repertoirePieces: RepertoirePiece[] = [
  {
    id: "rep-1",
    choir_id: "luzia-chor",
    title: "The Parting Glass",
    composer: "Trad. Irish / Arr. J. Wilson",
    era: "Traditionell"
  },
  {
    id: "rep-2",
    choir_id: "luzia-chor",
    title: "Sally Gardens",
    composer: "Herbert Hughes",
    era: "Romantik"
  },
  {
    id: "rep-3",
    choir_id: "luzia-chor",
    title: "The Skye Boat Song",
    composer: "Trad. Scottish / Arr. J. Rutter",
    era: "Traditionell"
  },
  {
    id: "rep-4",
    choir_id: "luzia-chor",
    title: "Greensleeves",
    composer: "Trad. English / Arr. R. Vaughan Williams",
    era: "Renaissance"
  },
  {
    id: "rep-5",
    choir_id: "luzia-chor",
    title: "Caledonia",
    composer: "Dougie MacLean / Arr. P. Knight",
    era: "Modern"
  },
  {
    id: "rep-6",
    choir_id: "luzia-chor",
    title: "Loch Lomond",
    composer: "Trad. Scottish / Arr. J. L. Frazier",
    era: "Traditionell"
  },
  {
    id: "rep-7",
    choir_id: "luzia-chor",
    title: "Scarborough Fair",
    composer: "Trad. English / Arr. J. Rutter",
    era: "Traditionell"
  },
  {
    id: "rep-8",
    choir_id: "luzia-chor",
    title: "Fields of Gold",
    composer: "Sting / Arr. P. Lawson",
    era: "Modern"
  },
  {
    id: "rep-9",
    choir_id: "luzia-chor",
    title: "Danny Boy",
    composer: "Trad. / Arr. J. Larsson",
    era: "Traditionell"
  },
  {
    id: "rep-10",
    choir_id: "luzia-chor",
    title: "The Water is Wide",
    composer: "Trad. / Arr. J. Carter",
    era: "Traditionell"
  },
  {
    id: "rep-11",
    choir_id: "luzia-chor",
    title: "A Gaelic Blessing",
    composer: "John Rutter",
    era: "Modern"
  },
  {
    id: "rep-12",
    choir_id: "luzia-chor",
    title: "My Love is Like a Red, Red Rose",
    composer: "Trad. / Arr. R. Browne",
    era: "Traditionell"
  },
  {
    id: "rep-13",
    choir_id: "luzia-chor",
    title: "Wild Mountain Thyme",
    composer: "Trad. / Arr. B. Chilcott",
    era: "Modern"
  },
  {
    id: "rep-14",
    choir_id: "luzia-chor",
    title: "The Ash Grove",
    composer: "Trad. Welsh / Arr. D. Willcocks",
    era: "Traditionell"
  },
  {
    id: "rep-15",
    choir_id: "luzia-chor",
    title: "All Through the Night",
    composer: "Trad. Welsh / Arr. P. Knight",
    era: "Traditionell"
  },
  {
    id: "rep-16",
    choir_id: "luzia-chor",
    title: "She Moved Through the Fair",
    composer: "Trad. / Arr. H. Davies",
    era: "Traditionell"
  },
  {
    id: "rep-17",
    choir_id: "luzia-chor",
    title: "The Lark in the Clear Air",
    composer: "Trad. / Arr. E. Daley",
    era: "Traditionell"
  },
  {
    id: "rep-18",
    choir_id: "luzia-chor",
    title: "Abide with Me",
    composer: "William H. Monk / Arr. A. Briggs",
    era: "Romantik"
  },
  {
    id: "rep-19",
    choir_id: "luzia-chor",
    title: "Lux Aeterna",
    composer: "Morten Lauridsen",
    era: "Modern"
  },
  {
    id: "rep-20",
    choir_id: "luzia-chor",
    title: "Ubi Caritas",
    composer: "Ola Gjeilo",
    era: "Modern"
  }
];

export const concertPrograms: ConcertProgram[] = [
  {
    id: "program-british-isles-2026",
    choir_id: "luzia-chor",
    project_id: "british-isles",
    title: "British Isles",
    season: "Frühjahr 2026",
    status: "current",
    pieces: [
      {
        id: "bi-1",
        title: "The Parting Glass",
        composer: "Trad. Irish / Arr. J. Wilson",
        duration: "3:20",
        pdf_url: "/files/notes/the-parting-glass.pdf",
        recording_url: "/files/recordings/the-parting-glass.mp3"
      },
      {
        id: "bi-2",
        title: "Sally Gardens",
        composer: "Herbert Hughes",
        duration: "2:45",
        pdf_url: "/files/notes/sally-gardens.pdf",
        recording_url: "/files/recordings/sally-gardens.mp3"
      },
      {
        id: "bi-3",
        title: "The Skye Boat Song",
        composer: "Trad. Scottish / Arr. J. Rutter",
        duration: "3:10",
        pdf_url: "/files/notes/the-skye-boat-song.pdf",
        recording_url: "/files/recordings/the-skye-boat-song.mp3"
      },
      {
        id: "bi-4",
        title: "Greensleeves",
        composer: "Trad. English / Arr. R. Vaughan Williams",
        duration: "2:55",
        pdf_url: "/files/notes/greensleeves.pdf",
        recording_url: "/files/recordings/greensleeves.mp3"
      },
      {
        id: "bi-5",
        title: "Caledonia",
        composer: "Dougie MacLean / Arr. P. Knight",
        duration: "4:05",
        pdf_url: "/files/notes/caledonia.pdf",
        recording_url: "/files/recordings/caledonia.mp3"
      },
      {
        id: "bi-6",
        title: "Loch Lomond",
        composer: "Trad. Scottish / Arr. J. L. Frazier",
        duration: "3:40",
        pdf_url: "/files/notes/loch-lomond.pdf",
        recording_url: "/files/recordings/loch-lomond.mp3"
      },
      {
        id: "bi-7",
        title: "Scarborough Fair",
        composer: "Trad. English / Arr. J. Rutter",
        duration: "3:15",
        pdf_url: "/files/notes/scarborough-fair.pdf",
        recording_url: "/files/recordings/scarborough-fair.mp3"
      },
      {
        id: "bi-8",
        title: "Fields of Gold",
        composer: "Sting / Arr. P. Lawson",
        duration: "3:50",
        pdf_url: "/files/notes/fields-of-gold.pdf",
        recording_url: "/files/recordings/fields-of-gold.mp3"
      },
      {
        id: "bi-9",
        title: "Danny Boy",
        composer: "Trad. / Arr. J. Larsson",
        duration: "3:05",
        pdf_url: "/files/notes/danny-boy.pdf",
        recording_url: "/files/recordings/danny-boy.mp3"
      },
      {
        id: "bi-10",
        title: "The Water is Wide",
        composer: "Trad. / Arr. J. Carter",
        duration: "3:00",
        pdf_url: "/files/notes/the-water-is-wide.pdf",
        recording_url: "/files/recordings/the-water-is-wide.mp3"
      },
      {
        id: "bi-11",
        title: "A Gaelic Blessing",
        composer: "John Rutter",
        duration: "2:20",
        pdf_url: "/files/notes/a-gaelic-blessing.pdf",
        recording_url: "/files/recordings/a-gaelic-blessing.mp3"
      },
      {
        id: "bi-12",
        title: "My Love is Like a Red, Red Rose",
        composer: "Trad. / Arr. R. Browne",
        duration: "2:35",
        pdf_url: "/files/notes/my-love-is-like-a-red-red-rose.pdf",
        recording_url: "/files/recordings/my-love-is-like-a-red-red-rose.mp3"
      },
      {
        id: "bi-13",
        title: "Wild Mountain Thyme",
        composer: "Trad. / Arr. B. Chilcott",
        duration: "3:25",
        pdf_url: "/files/notes/wild-mountain-thyme.pdf",
        recording_url: "/files/recordings/wild-mountain-thyme.mp3"
      },
      {
        id: "bi-14",
        title: "The Ash Grove",
        composer: "Trad. Welsh / Arr. D. Willcocks",
        duration: "2:40",
        pdf_url: "/files/notes/the-ash-grove.pdf",
        recording_url: "/files/recordings/the-ash-grove.mp3"
      },
      {
        id: "bi-15",
        title: "All Through the Night",
        composer: "Trad. Welsh / Arr. P. Knight",
        duration: "3:05",
        pdf_url: "/files/notes/all-through-the-night.pdf",
        recording_url: "/files/recordings/all-through-the-night.mp3"
      },
      {
        id: "bi-16",
        title: "She Moved Through the Fair",
        composer: "Trad. / Arr. H. Davies",
        duration: "3:15",
        pdf_url: "/files/notes/she-moved-through-the-fair.pdf",
        recording_url: "/files/recordings/she-moved-through-the-fair.mp3"
      },
      {
        id: "bi-17",
        title: "The Parting Glass (Reprise)",
        composer: "Trad. / Arr. J. Wilson",
        duration: "1:45",
        pdf_url: "/files/notes/the-parting-glass-reprise.pdf",
        recording_url: "/files/recordings/the-parting-glass-reprise.mp3"
      },
      {
        id: "bi-18",
        title: "The Lark in the Clear Air",
        composer: "Trad. / Arr. E. Daley",
        duration: "2:55",
        pdf_url: "/files/notes/the-lark-in-the-clear-air.pdf",
        recording_url: "/files/recordings/the-lark-in-the-clear-air.mp3"
      },
      {
        id: "bi-19",
        title: "Skye Boat Song (Encore)",
        composer: "Trad. / Arr. J. Rutter",
        duration: "2:35",
        pdf_url: "/files/notes/skye-boat-song-encore.pdf",
        recording_url: "/files/recordings/skye-boat-song-encore.mp3"
      },
      {
        id: "bi-20",
        title: "Abide with Me",
        composer: "William H. Monk / Arr. A. Briggs",
        duration: "3:00",
        pdf_url: "/files/notes/abide-with-me.pdf",
        recording_url: "/files/recordings/abide-with-me.mp3"
      }
    ]
  },
  {
    id: "program-nocturnes-2025",
    choir_id: "luzia-chor",
    title: "Nocturnes",
    season: "Herbst 2025",
    status: "archived",
    pieces: [
      {
        id: "no-1",
        title: "Lux Aeterna",
        composer: "Morten Lauridsen",
        duration: "4:30",
        pdf_url: "/files/notes/lux-aeterna.pdf",
        recording_url: "/files/recordings/lux-aeterna.mp3"
      },
      {
        id: "no-2",
        title: "Ubi Caritas",
        composer: "Ola Gjeilo",
        duration: "5:05",
        pdf_url: "/files/notes/ubi-caritas.pdf",
        recording_url: "/files/recordings/ubi-caritas.mp3"
      },
      {
        id: "no-3",
        title: "Nunc Dimittis",
        composer: "Gustav Holst",
        duration: "3:40",
        pdf_url: "/files/notes/nunc-dimittis.pdf",
        recording_url: "/files/recordings/nunc-dimittis.mp3"
      },
      {
        id: "no-4",
        title: "The Lord Bless You and Keep You",
        composer: "John Rutter",
        duration: "4:10",
        pdf_url: "/files/notes/the-lord-bless-you.pdf",
        recording_url: "/files/recordings/the-lord-bless-you.mp3"
      },
      {
        id: "no-5",
        title: "Ave Verum Corpus",
        composer: "William Byrd",
        duration: "2:30",
        pdf_url: "/files/notes/ave-verum-corpus.pdf",
        recording_url: "/files/recordings/ave-verum-corpus.mp3"
      },
      {
        id: "no-6",
        title: "O Nata Lux",
        composer: "Thomas Tallis",
        duration: "2:45",
        pdf_url: "/files/notes/o-nata-lux.pdf",
        recording_url: "/files/recordings/o-nata-lux.mp3"
      },
      {
        id: "no-7",
        title: "O Magnum Mysterium",
        composer: "Morten Lauridsen",
        duration: "5:00",
        pdf_url: "/files/notes/o-magnum-mysterium.pdf",
        recording_url: "/files/recordings/o-magnum-mysterium.mp3"
      },
      {
        id: "no-8",
        title: "Sleep",
        composer: "Eric Whitacre",
        duration: "5:15",
        pdf_url: "/files/notes/sleep.pdf",
        recording_url: "/files/recordings/sleep.mp3"
      },
      {
        id: "no-9",
        title: "Sure On This Shining Night",
        composer: "Morten Lauridsen",
        duration: "3:50",
        pdf_url: "/files/notes/sure-on-this-shining-night.pdf",
        recording_url: "/files/recordings/sure-on-this-shining-night.mp3"
      },
      {
        id: "no-10",
        title: "The Cloths of Heaven",
        composer: "Eric Whitacre",
        duration: "4:35",
        pdf_url: "/files/notes/the-cloths-of-heaven.pdf",
        recording_url: "/files/recordings/the-cloths-of-heaven.mp3"
      },
      {
        id: "no-11",
        title: "If Ye Love Me",
        composer: "Thomas Tallis",
        duration: "2:50",
        pdf_url: "/files/notes/if-ye-love-me.pdf",
        recording_url: "/files/recordings/if-ye-love-me.mp3"
      },
      {
        id: "no-12",
        title: "Sing Me to Heaven",
        composer: "Gawthrop",
        duration: "4:05",
        pdf_url: "/files/notes/sing-me-to-heaven.pdf",
        recording_url: "/files/recordings/sing-me-to-heaven.mp3"
      },
      {
        id: "no-13",
        title: "The Seal Lullaby",
        composer: "Eric Whitacre",
        duration: "3:25",
        pdf_url: "/files/notes/the-seal-lullaby.pdf",
        recording_url: "/files/recordings/the-seal-lullaby.mp3"
      },
      {
        id: "no-14",
        title: "Tebe Poem",
        composer: "Pavel Chesnokov",
        duration: "3:30",
        pdf_url: "/files/notes/tebe-poem.pdf",
        recording_url: "/files/recordings/tebe-poem.mp3"
      },
      {
        id: "no-15",
        title: "Bogoroditse Devo",
        composer: "Sergei Rachmaninoff",
        duration: "3:10",
        pdf_url: "/files/notes/bogoroditse-devo.pdf",
        recording_url: "/files/recordings/bogoroditse-devo.mp3"
      },
      {
        id: "no-16",
        title: "Panis Angelicus",
        composer: "Cesar Franck",
        duration: "3:20",
        pdf_url: "/files/notes/panis-angelicus.pdf",
        recording_url: "/files/recordings/panis-angelicus.mp3"
      },
      {
        id: "no-17",
        title: "Evening Hymn",
        composer: "Henry Balfour Gardiner",
        duration: "4:25",
        pdf_url: "/files/notes/evening-hymn.pdf",
        recording_url: "/files/recordings/evening-hymn.mp3"
      }
    ]
  },
  {
    id: "program-amber-2025",
    choir_id: "luzia-chor",
    title: "Amber Fields",
    season: "Sommer 2025",
    status: "archived",
    pieces: [
      {
        id: "am-1",
        title: "Evening Rise",
        composer: "Trad. / Arr. J. Miller",
        duration: "3:10",
        pdf_url: "/files/notes/evening-rise.pdf",
        recording_url: "/files/recordings/evening-rise.mp3"
      },
      {
        id: "am-2",
        title: "The Road Home",
        composer: "Stephen Paulus",
        duration: "4:15",
        pdf_url: "/files/notes/the-road-home.pdf",
        recording_url: "/files/recordings/the-road-home.mp3"
      },
      {
        id: "am-3",
        title: "Shenandoah",
        composer: "Trad. / Arr. J. Erb",
        duration: "3:55",
        pdf_url: "/files/notes/shenandoah.pdf",
        recording_url: "/files/recordings/shenandoah.mp3"
      },
      {
        id: "am-4",
        title: "This Little Light of Mine",
        composer: "Spiritual / Arr. M. Hayes",
        duration: "2:45",
        pdf_url: "/files/notes/this-little-light-of-mine.pdf",
        recording_url: "/files/recordings/this-little-light-of-mine.mp3"
      },
      {
        id: "am-5",
        title: "Simple Gifts",
        composer: "Shaker / Arr. R. Ringwald",
        duration: "2:50",
        pdf_url: "/files/notes/simple-gifts.pdf",
        recording_url: "/files/recordings/simple-gifts.mp3"
      },
      {
        id: "am-6",
        title: "Wade in the Water",
        composer: "Spiritual / Arr. M. Ramsey",
        duration: "3:05",
        pdf_url: "/files/notes/wade-in-the-water.pdf",
        recording_url: "/files/recordings/wade-in-the-water.mp3"
      },
      {
        id: "am-7",
        title: "Bound for the Promised Land",
        composer: "Trad. / Arr. J. Martin",
        duration: "3:15",
        pdf_url: "/files/notes/bound-for-the-promised-land.pdf",
        recording_url: "/files/recordings/bound-for-the-promised-land.mp3"
      },
      {
        id: "am-8",
        title: "Deep River",
        composer: "Spiritual / Arr. M. Hogan",
        duration: "4:05",
        pdf_url: "/files/notes/deep-river.pdf",
        recording_url: "/files/recordings/deep-river.mp3"
      },
      {
        id: "am-9",
        title: "City Called Heaven",
        composer: "Spiritual / Arr. J. T. Peppers",
        duration: "3:35",
        pdf_url: "/files/notes/city-called-heaven.pdf",
        recording_url: "/files/recordings/city-called-heaven.mp3"
      },
      {
        id: "am-10",
        title: "Come, Thou Fount",
        composer: "Trad. / Arr. M. H. Cohen",
        duration: "3:10",
        pdf_url: "/files/notes/come-thou-fount.pdf",
        recording_url: "/files/recordings/come-thou-fount.mp3"
      },
      {
        id: "am-11",
        title: "Let the River Run",
        composer: "Carly Simon / Arr. C. Emmons",
        duration: "3:20",
        pdf_url: "/files/notes/let-the-river-run.pdf",
        recording_url: "/files/recordings/let-the-river-run.mp3"
      },
      {
        id: "am-12",
        title: "Bridge Over Troubled Water",
        composer: "Simon & Garfunkel / Arr. A. Brymer",
        duration: "4:25",
        pdf_url: "/files/notes/bridge-over-troubled-water.pdf",
        recording_url: "/files/recordings/bridge-over-troubled-water.mp3"
      },
      {
        id: "am-13",
        title: "Swing Low, Sweet Chariot",
        composer: "Spiritual / Arr. M. Hayes",
        duration: "2:55",
        pdf_url: "/files/notes/swing-low-sweet-chariot.pdf",
        recording_url: "/files/recordings/swing-low-sweet-chariot.mp3"
      },
      {
        id: "am-14",
        title: "Down to the River to Pray",
        composer: "Trad. / Arr. S. Hopkins",
        duration: "3:05",
        pdf_url: "/files/notes/down-to-the-river-to-pray.pdf",
        recording_url: "/files/recordings/down-to-the-river-to-pray.mp3"
      },
      {
        id: "am-15",
        title: "Great Day",
        composer: "Spiritual / Arr. W. L. Dawson",
        duration: "3:15",
        pdf_url: "/files/notes/great-day.pdf",
        recording_url: "/files/recordings/great-day.mp3"
      },
      {
        id: "am-16",
        title: "Wayfaring Stranger",
        composer: "Trad. / Arr. J. Niles",
        duration: "3:45",
        pdf_url: "/files/notes/wayfaring-stranger.pdf",
        recording_url: "/files/recordings/wayfaring-stranger.mp3"
      },
      {
        id: "am-17",
        title: "How Can I Keep From Singing?",
        composer: "Trad. / Arr. T. Grassi",
        duration: "3:30",
        pdf_url: "/files/notes/how-can-i-keep-from-singing.pdf",
        recording_url: "/files/recordings/how-can-i-keep-from-singing.mp3"
      },
      {
        id: "am-18",
        title: "Give Me Jesus",
        composer: "Spiritual / Arr. M. Hogan",
        duration: "4:10",
        pdf_url: "/files/notes/give-me-jesus.pdf",
        recording_url: "/files/recordings/give-me-jesus.mp3"
      },
      {
        id: "am-19",
        title: "Rock-a My Soul",
        composer: "Spiritual / Arr. J. Nathan",
        duration: "3:00",
        pdf_url: "/files/notes/rock-a-my-soul.pdf",
        recording_url: "/files/recordings/rock-a-my-soul.mp3"
      },
      {
        id: "am-20",
        title: "Precious Lord, Take My Hand",
        composer: "Thomas A. Dorsey / Arr. M. Hayes",
        duration: "4:05",
        pdf_url: "/files/notes/precious-lord.pdf",
        recording_url: "/files/recordings/precious-lord.mp3"
      },
      {
        id: "am-21",
        title: "We Shall Overcome",
        composer: "Trad. / Arr. J. Norton",
        duration: "3:25",
        pdf_url: "/files/notes/we-shall-overcome.pdf",
        recording_url: "/files/recordings/we-shall-overcome.mp3"
      }
    ]
  }
];

export const concertsByProject: Record<string, Concert[]> = {
  "british-isles": [
    {
      id: "bi-con-1",
      project_id: "british-isles",
      date: "2026-05-02",
      time: "Vorprobe 17:00-18:30 · Konzert 19:30",
      place: "Raum Zürich"
    },
    {
      id: "bi-con-2",
      project_id: "british-isles",
      date: "2026-05-03",
      time: "Vorprobe 14:30-16:00 · Konzert 17:00",
      place: "Raum Zürich"
    }
  ]
};

export const rehearsalsByProject: Record<string, Rehearsal[]> = {
  "british-isles": [
    {
      id: "bi-reh-1",
      project_id: "british-isles",
      date: "2026-03-03",
      start_time: "19:30",
      end_time: "21:30",
      location: "Pfrundhaus, Zürich"
    },
    {
      id: "bi-reh-2",
      project_id: "british-isles",
      date: "2026-03-10",
      start_time: "19:30",
      end_time: "21:30",
      location: "Pfrundhaus, Zürich"
    },
    {
      id: "bi-reh-3",
      project_id: "british-isles",
      date: "2026-03-17",
      start_time: "19:30",
      end_time: "21:30",
      location: "Pfrundhaus, Zürich"
    },
    {
      id: "bi-reh-4",
      project_id: "british-isles",
      date: "2026-03-21",
      start_time: "11:00",
      end_time: "18:00",
      location: "Raum Zürich (Probetag)"
    },
    {
      id: "bi-reh-5",
      project_id: "british-isles",
      date: "2026-03-24",
      start_time: "19:30",
      end_time: "21:30",
      location: "Pfrundhaus, Zürich"
    },
    {
      id: "bi-reh-6",
      project_id: "british-isles",
      date: "2026-03-31",
      start_time: "19:30",
      end_time: "21:30",
      location: "Pfrundhaus, Zürich"
    },
    {
      id: "bi-reh-7",
      project_id: "british-isles",
      date: "2026-04-07",
      start_time: "19:30",
      end_time: "21:30",
      location: "Pfrundhaus, Zürich"
    },
    {
      id: "bi-reh-8",
      project_id: "british-isles",
      date: "2026-04-14",
      start_time: "19:30",
      end_time: "21:30",
      location: "Pfrundhaus, Zürich"
    },
    {
      id: "bi-reh-9",
      project_id: "british-isles",
      date: "2026-04-17",
      start_time: "17:30",
      end_time: "19:30",
      location: "Predigerkirche, Zürich (Vesper)"
    },
    {
      id: "bi-reh-10",
      project_id: "british-isles",
      date: "2026-04-21",
      start_time: "19:30",
      end_time: "21:30",
      location: "Pfrundhaus, Zürich"
    },
    {
      id: "bi-reh-11",
      project_id: "british-isles",
      date: "2026-04-28",
      start_time: "19:00",
      end_time: "22:00",
      location: "Pfrundhaus, Zürich (Generalprobe)"
    }
  ]
};

export const projectParticipations: ProjectParticipation[] = memberships.map(
  (member, index) => {
    const mod = (index + 1) % 12;
    const invite_status = mod === 0 ? "declined" : mod === 5 ? "invited" : "confirmed";
    return {
      project_id: "british-isles",
      person_id: member.person_id,
      invite_status
    };
  }
);

const generateAvailability = (): Availability[] => {
  const rehearsals = Object.values(rehearsalsByProject).flat();
  const criticalIds = new Set(["bi-reh-4", "bi-reh-9"]);
  const warningIds = new Set(["bi-reh-2", "bi-reh-7"]);
  return rehearsals.flatMap((rehearsal, rehearsalIndex) =>
    memberships.map((member, memberIndex) => {
      if (criticalIds.has(rehearsal.id)) {
        const voiceGroup = Math.floor(memberIndex / 8);
        const mod = memberIndex % 8;
        const isStrongVoice = voiceGroup < 2;
        const status = isStrongVoice
          ? mod < 5
            ? "yes"
            : mod < 7
              ? "unknown"
              : "no"
          : mod < 2
            ? "yes"
            : mod < 6
              ? "no"
              : "unknown";
        return {
          rehearsal_id: rehearsal.id,
          person_id: member.person_id,
          status
        };
      }
      if (warningIds.has(rehearsal.id)) {
        const mod = (memberIndex * 3 + rehearsalIndex) % 20;
        const status = mod < 12 ? "yes" : mod < 17 ? "unknown" : "no";
        return {
          rehearsal_id: rehearsal.id,
          person_id: member.person_id,
          status
        };
      }
      const mod = (rehearsalIndex * 5 + memberIndex * 2) % 20;
      const status = mod < 16 ? "yes" : mod < 19 ? "unknown" : "no";
      return {
        rehearsal_id: rehearsal.id,
        person_id: member.person_id,
        status
      };
    })
  );
};

export const availability: Availability[] = generateAvailability();

export const defaultChoirId = choirs[0].id;

export const getPersonName = (person: Person) =>
  `${person.first_name} ${person.last_name}`;

export const getMembership = (
  personId: string,
  choirId: string = defaultChoirId
) =>
  memberships.find(
    (item) => item.person_id === personId && item.choir_id === choirId
  );
