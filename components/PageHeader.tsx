"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { strings } from "@/lib/i18n";

export default function PageHeader({
  title,
  currentPath,
  onCreateChoir
}: {
  title: string;
  currentPath: string;
  onCreateChoir: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deletingChoirId, setDeletingChoirId] = useState<string | null>(null);
  const {
    choirs,
    activeChoirId,
    setActiveChoirId,
    adminProfile,
    snapshot,
    replaceSnapshot
  } = useAppData();
  const menuRef = useRef<HTMLDivElement>(null);
  const showOverviewLink =
    currentPath.startsWith("/projects") &&
    currentPath !== "/projects/overview";
  const showNewProjectButton = currentPath === "/projects";

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedChoir = choirs.find((choir) => choir.id === activeChoirId) || choirs[0];
  const selected = selectedChoir?.name ?? "Ensemble";

  const handleSelect = async (value: string) => {
    if (value === "new") {
      onCreateChoir();
      setOpen(false);
      return;
    }
    try {
      await setActiveChoirId(value);
    } catch {
      window.alert("Ensemble konnte nicht gewechselt werden.");
    }
    setOpen(false);
  };

  const handleComingSoon = () => {
    window.alert("Diese Funktion kommt in einer späteren Version der App.");
  };

  const handleDeleteChoir = async (choirId: string, choirName: string) => {
    const confirmed = window.confirm(
      `Ensemble "${choirName}" wirklich löschen? Projekte, Mitgliedschaften und zugehörige Daten werden entfernt.`
    );
    if (!confirmed) return;

    setDeletingChoirId(choirId);
    try {
      const response = await fetch(`/api/choirs/${choirId}`, {
        method: "DELETE"
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Ensemble konnte nicht gelöscht werden.");
      }

      const nextChoirs = snapshot.choirs.filter((choir) => choir.id !== choirId);
      const fallbackNextChoirId = nextChoirs[0]?.id ?? "";
      const nextActiveChoirId =
        choirId === activeChoirId
          ? payload.nextActiveChoirId || fallbackNextChoirId
          : activeChoirId;

      replaceSnapshot({
        ...snapshot,
        choirs: nextChoirs,
        activeChoirId: nextActiveChoirId,
        personSettings: {
          ...snapshot.personSettings,
          active_choir_id: nextActiveChoirId || undefined
        }
      });

      setOpen(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Ensemble konnte nicht gelöscht werden.";
      window.alert(message);
    } finally {
      setDeletingChoirId(null);
    }
  };

  const initials = `${adminProfile.first_name[0] ?? ""}${
    adminProfile.last_name[0] ?? ""
  }`
    .toUpperCase()
    .trim();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            {title}
          </h1>
          {showOverviewLink ? (
            <Link
              href="/projects/overview"
              className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700 sm:inline-flex"
            >
              {strings.projects.overviewButton}
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {showNewProjectButton ? (
            <button
              type="button"
              onClick={handleComingSoon}
              className="hidden rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:border-slate-800 hover:bg-slate-800 sm:inline-flex"
            >
              {strings.projects.newProject}
            </button>
          ) : null}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              onClick={() => setOpen((prev) => !prev)}
              className="flex min-w-[150px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/60 sm:min-w-[190px]"
            >
              <span className="truncate">{selected}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {open ? (
              <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
                  Ensemble wählen
                </div>
                <ul className="pb-2">
                  {choirs.map((choir) => (
                    <li key={choir.id}>
                      {/** Keep at least one choir for the current admin context. */}
                      {(() => {
                        const cannotDeleteLastChoir = choirs.length <= 1;
                        return (
                      <div className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50">
                        <button
                          type="button"
                          onClick={() => void handleSelect(choir.id)}
                          className="flex-1 rounded-md px-2 py-1 text-left text-sm text-slate-700"
                        >
                          {choir.name}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void handleDeleteChoir(choir.id, choir.name);
                          }}
                          disabled={cannotDeleteLastChoir || deletingChoirId === choir.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:text-rose-600 disabled:opacity-60"
                          aria-label={`Ensemble ${choir.name} löschen`}
                          title={
                            cannotDeleteLastChoir
                              ? "Mindestens ein Ensemble muss erhalten bleiben"
                              : "Ensemble löschen"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                        );
                      })()}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-slate-100 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => void handleSelect("new")}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  >
                    <Plus className="h-4 w-4" />
                    Neues Ensemble hinzufügen
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <Link
            href="/admin-profile"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300"
            aria-label="Profil"
            title="Profil öffnen"
          >
            {initials || "PR"}
          </Link>
        </div>
      </div>
    </header>
  );
}
