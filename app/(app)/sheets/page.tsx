"use client";

import Card from "@/components/Card";
import RepertoireTopBar from "@/components/RepertoireTopBar";
import { strings } from "@/lib/i18n";
import {
  concertPrograms,
  defaultChoirId,
  repertoirePieces
} from "@/lib/mockData";

export default function RepertoirePage() {
  const handleComingSoon = () => {
    window.alert("Diese Funktion kommt in einer späteren Version der App.");
  };

  const currentProgram =
    concertPrograms.find(
      (program) =>
        program.choir_id === defaultChoirId && program.status === "current"
    ) ?? concertPrograms.find((program) => program.choir_id === defaultChoirId);
  const otherPrograms = concertPrograms
    .filter(
      (program) =>
        program.choir_id === defaultChoirId && program.id !== currentProgram?.id
    )
    .slice(0, 5);
  const totalRepertoire = new Set(
    concertPrograms
      .filter((program) => program.choir_id === defaultChoirId)
      .flatMap((program) => program.pieces.map((piece) => piece.id))
  ).size;
  const programPieces = currentProgram?.pieces ?? [];

  return (
    <div className="flex flex-col gap-6">
      <RepertoireTopBar />
      <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card className="order-2 flex h-full flex-col lg:order-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {currentProgram ? currentProgram.title : "—"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {currentProgram ? currentProgram.season : "—"}
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
              {programPieces.length} {strings.repertoire.pieceCount}
            </span>
          </div>

          <div className="mt-4">
            <ol className="space-y-3 text-sm text-slate-600">
              {programPieces.map((piece, index) => (
                <li
                  key={piece.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-800">
                          {piece.title}
                        </span>
                        {piece.duration ? (
                          <span className="text-xs text-slate-400">
                            {piece.duration}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {piece.composer}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
                        <a
                          href={piece.pdf_url}
                          onClick={(event) => {
                            event.preventDefault();
                            handleComingSoon();
                          }}
                          className="text-slate-500 underline decoration-dashed underline-offset-4 transition hover:text-slate-700"
                        >
                          {strings.repertoire.pdfLink}
                        </a>
                        <a
                          href={piece.recording_url}
                          onClick={(event) => {
                            event.preventDefault();
                            handleComingSoon();
                          }}
                          className="text-slate-500 underline decoration-dashed underline-offset-4 transition hover:text-slate-700"
                        >
                          {strings.repertoire.recordingLink}
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Card>

        <div className="order-1 flex flex-col gap-4 lg:order-2">
          <Card>
            <div className="text-xs uppercase text-slate-400">
              {strings.repertoire.totalLibrary}
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {totalRepertoire}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {strings.repertoire.pieceCount}
            </div>
          </Card>

          <div className="grid gap-3">
            {otherPrograms.length > 0 ? (
              otherPrograms.map((program) => (
                <a
                  key={program.id}
                  href="/sheets"
                  className="block"
                  onClick={(event) => {
                    event.preventDefault();
                    handleComingSoon();
                  }}
                >
                  <Card className="transition hover:border-slate-300">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-slate-900">
                          {program.title}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {program.season}
                        </div>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500">
                        {program.pieces.length} {strings.repertoire.pieceCount}
                      </span>
                    </div>
                  </Card>
                </a>
              ))
            ) : (
              <Card>
                <div className="text-xs uppercase text-slate-400">
                  {strings.repertoire.otherPrograms}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {strings.repertoire.noOtherPrograms}
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
