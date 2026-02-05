 "use client";

import { useState } from "react";
import { Clock, Mail, MessageCircle, MessagesSquare } from "lucide-react";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import { strings } from "@/lib/i18n";

type ActivityItem = {
  id: string;
  title: string;
  excerpt: string;
  time: string;
  sender: string;
  sender_role?: "Leitung" | "Vorstand";
  direction: "outgoing" | "incoming";
  audience: string;
  channel: "whatsapp" | "email" | "notice";
};

const activityItems: ActivityItem[] = [
  {
    id: "1",
    title: "Probe verschoben auf 20:00 Uhr",
    excerpt: "Neue Uhrzeit für Dienstag bestätigt.",
    time: "Heute, 14:05",
    sender: "Lisa May Appenzeller",
    sender_role: "Leitung",
    direction: "outgoing",
    audience: "Gesamtchor",
    channel: "whatsapp"
  },
  {
    id: "2",
    title: "E-Mail: Programm-Update März",
    excerpt: "PDF mit aktualisierter Reihenfolge angehängt.",
    time: "Gestern, 19:22",
    sender: "Sarah Meier",
    sender_role: "Vorstand",
    direction: "outgoing",
    audience: "Alle Sänger:innen",
    channel: "email"
  },
  {
    id: "3",
    title: "Frage zur Alt-Besetzung",
    excerpt: "Bitte kurze Rückmeldung bis Freitag.",
    time: "03. Feb, 10:18",
    sender: "Elena Hug",
    direction: "incoming",
    audience: "Alt · Stimmführung",
    channel: "whatsapp"
  },
  {
    id: "4",
    title: "Hinweis: Garderobe Konzert",
    excerpt: "Einlass für Mitwirkende ab 17:30 Uhr.",
    time: "02. Feb, 08:40",
    sender: "Rahel Bieri",
    sender_role: "Vorstand",
    direction: "outgoing",
    audience: "Projektteam",
    channel: "notice"
  },
  {
    id: "5",
    title: "WhatsApp: Rückfrage Notenstimme",
    excerpt: "Kannst du mir die Tenor-Stimme als PDF schicken?",
    time: "02. Feb, 18:12",
    sender: "+41 79 332 44 21",
    direction: "incoming",
    audience: "Leitung",
    channel: "whatsapp"
  },
  {
    id: "6",
    title: "E-Mail: Probenplan bestätigt",
    excerpt: "Alle Termine stehen im Kalender, danke!",
    time: "01. Feb, 09:05",
    sender: "Nadia Frei",
    direction: "incoming",
    audience: "Leitung",
    channel: "email"
  },
  {
    id: "7",
    title: "E-Mail: Erinnerung an Projektmeeting",
    excerpt: "Bitte um kurze Teilnahmebestätigung.",
    time: "31. Jan, 16:30",
    sender: "Lisa May Appenzeller",
    sender_role: "Leitung",
    direction: "outgoing",
    audience: "Projektteam",
    channel: "email"
  },
  {
    id: "8",
    title: "WhatsApp: Stimmbildung nächste Woche",
    excerpt: "Können wir vor der Probe 20 Minuten früher starten?",
    time: "31. Jan, 11:12",
    sender: "Lara Baumann",
    direction: "incoming",
    audience: "Leitung",
    channel: "whatsapp"
  },
  {
    id: "9",
    title: "E-Mail: Konzertkleidung",
    excerpt: "Bitte schwarz/anthrazit, keine Muster.",
    time: "30. Jan, 13:45",
    sender: "Rahel Bieri",
    sender_role: "Vorstand",
    direction: "outgoing",
    audience: "Gesamtchor",
    channel: "email"
  },
  {
    id: "10",
    title: "WhatsApp: Abmeldung Probe",
    excerpt: "Ich bin morgen krank und kann nicht kommen.",
    time: "30. Jan, 08:10",
    sender: "+41 76 901 55 09",
    direction: "incoming",
    audience: "Leitung",
    channel: "whatsapp"
  }
];

const channelMeta: Record<
  ActivityItem["channel"],
  { icon: JSX.Element; label: string }
> = {
  whatsapp: {
    icon: <MessageCircle className="h-4 w-4 text-slate-500" />,
    label: "WhatsApp"
  },
  email: {
    icon: <Mail className="h-4 w-4 text-slate-500" />,
    label: "E-Mail"
  },
  notice: {
    icon: <MessagesSquare className="h-4 w-4 text-slate-500" />,
    label: "Notiz"
  }
};

export default function CommunicationPage() {
  const [selectedChannel, setSelectedChannel] = useState<"email" | "whatsapp">(
    "email"
  );
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(
    ["soprano", "alto", "tenor", "bass", "leitung", "vorstand"]
  );
  const handleComingSoon = () => {
    window.alert("Diese Funktion kommt in einer späteren Version der App.");
  };
  const toggleRecipient = (value: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {strings.communication.timelineTitle}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {strings.communication.timelineSubtitle}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              Letzte 7 Tage
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                {channelMeta.email.icon}
                <span>{channelMeta.email.label}</span>
              </div>
              <div className="mt-3 divide-y divide-slate-100">
                {activityItems
                  .filter((item) => item.channel === "email")
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={handleComingSoon}
                      className="w-full py-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="text-xs text-slate-400">{item.time}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-800">
                        <span>{item.title}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.direction === "outgoing" && item.sender_role
                          ? `${item.sender_role} · ${item.sender}`
                          : item.sender}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.excerpt}
                      </p>
                    </button>
                  ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                {channelMeta.whatsapp.icon}
                <span>{channelMeta.whatsapp.label}</span>
              </div>
              <div className="mt-3 divide-y divide-slate-100">
                {activityItems
                  .filter((item) => item.channel === "whatsapp")
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={handleComingSoon}
                      className="w-full py-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="text-xs text-slate-400">{item.time}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.direction === "outgoing" && item.sender_role
                          ? `${item.sender_role} · ${item.sender}`
                          : item.sender}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.excerpt}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {strings.communication.composerTitle}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {strings.communication.composerSubtitle}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">Kanal</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  aria-pressed={selectedChannel === "email"}
                  onClick={() => setSelectedChannel("email")}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    selectedChannel === "email"
                      ? "border-slate-300 bg-white text-slate-700 shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </button>
                <button
                  type="button"
                  aria-pressed={selectedChannel === "whatsapp"}
                  onClick={() => setSelectedChannel("whatsapp")}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    selectedChannel === "whatsapp"
                      ? "border-slate-300 bg-white text-slate-700 shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </button>
              </div>
            </div>
            {selectedChannel === "email" ? (
              <div>
                <p className="text-xs text-slate-400">Empfänger</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { id: "soprano", label: "Sopran", color: "var(--voice-soprano)" },
                    { id: "alto", label: "Alt", color: "var(--voice-alto)" },
                    { id: "tenor", label: "Tenor", color: "var(--voice-tenor)" },
                    { id: "bass", label: "Bass", color: "var(--voice-bass)" },
                    { id: "leitung", label: "Leitung" },
                    { id: "vorstand", label: "Vorstand" }
                  ].map((recipient) => {
                    const isSelected = selectedRecipients.includes(recipient.id);
                    return (
                      <button
                        key={recipient.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggleRecipient(recipient.id)}
                        className="transition"
                      >
                        <Badge
                          dotColor={recipient.color}
                          className={
                            isSelected
                              ? "border-slate-400 bg-slate-50 text-slate-700"
                              : "border-slate-200 bg-white text-slate-400"
                          }
                        >
                          {recipient.label}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {selectedChannel === "email" ? (
              <div>
                <p className="text-xs text-slate-400">Betreff</p>
                <button
                  type="button"
                  onClick={handleComingSoon}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-600 transition hover:border-slate-300"
                >
                  Update zur Probenwoche
                </button>
              </div>
            ) : null}
            <div>
              <p className="text-xs text-slate-400">Inhalt</p>
              <button
                type="button"
                onClick={handleComingSoon}
                className="mt-2 min-h-[120px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-500 transition hover:border-slate-300"
              >
                Kurzer Überblick zu Zeiten, Raumplan und benötigten Noten.
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleComingSoon}
                className="w-28 rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm"
              >
                Senden
              </button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
