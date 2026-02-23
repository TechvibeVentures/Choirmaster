import type { Concert, Project, Rehearsal } from "@/lib/domain/types";

// Intentionally only "Projekte"-related mock data.

export const projects: Project[] = [
  {
    id: "british-isles",
    choir_id: "",
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

