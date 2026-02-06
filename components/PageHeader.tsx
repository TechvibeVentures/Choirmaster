"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { adminProfile, choirs } from "@/lib/mockData";
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
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(choirs[0]?.name ?? "Ensemble");
  const menuRef = useRef<HTMLDivElement>(null);
  const showOverviewLink =
    currentPath.startsWith("/projects") &&
    currentPath !== "/projects/overview";

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (value: string, label: string) => {
    if (value === "new") {
      onCreateChoir();
      setOpen(false);
      return;
    }
    setSelected(label);
    setOpen(false);
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
                      <button
                        type="button"
                        onClick={() => handleSelect(choir.id, choir.name)}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {choir.name}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-slate-100 px-3 py-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleSelect("new", "Neues Ensemble hinzufügen")
                    }
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
