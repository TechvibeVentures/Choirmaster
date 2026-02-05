"use client";

import { useState } from "react";

export default function RepertoireTopBar() {
  const [alerted, setAlerted] = useState(false);

  const showComingSoon = () => {
    if (alerted) return;
    setAlerted(true);
    window.alert("Diese Funktion kommt in einer späteren Version der App.");
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-md">
        <input
          type="search"
          placeholder="Noten durchsuchen"
          onClick={showComingSoon}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-slate-300 focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={showComingSoon}
        className="rounded-xl border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
      >
        Noten hinzufügen
      </button>
    </div>
  );
}
