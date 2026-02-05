import type { Weekday } from "@/lib/mockData";

const weekdayLabels: Record<Weekday, string> = {
  Mon: "Mo",
  Tue: "Di",
  Wed: "Mi",
  Thu: "Do",
  Fri: "Fr",
  Sat: "Sa",
  Sun: "So"
};

export const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${isoDate}T00:00:00`));

export const formatDateRange = (start: string, end: string) =>
  `${formatDate(start)} – ${formatDate(end)}`;

export const formatWeekdays = (days: Weekday[]) =>
  days.map((day) => weekdayLabels[day]).join(" · ");

export const formatTimeRange = (start: string, end: string) => `${start}–${end}`;
