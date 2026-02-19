import type {
  ConcertProgram,
  ProgramPiece,
  RepertoirePiece
} from "@/lib/domain/types";
import {
  mapProgramPieces,
  mapProgramStatus,
  safeTableMissing
} from "@/lib/data/common";
import { getServerSupabaseClient } from "@/lib/supabase/server";

type ProgramPieceRow = {
  id: string;
  title: string;
  composer: string;
  duration: string | null;
  pdf_url: string;
  recording_url: string;
  sort_order: number;
  program_id: string;
};

export const getRepertoireByChoirIds = async (choirIds: string[]) => {
  if (!choirIds.length) {
    return {
      pieces: [] as RepertoirePiece[],
      programs: [] as ConcertProgram[]
    };
  }

  const supabase = getServerSupabaseClient();
  const db = supabase as any;

  const [piecesRes, programsRes] = await Promise.all([
    db
      .from("repertoire_pieces")
      .select("id, choir_id, title, composer, era")
      .in("choir_id", choirIds),
    db
      .from("concert_programs")
      .select("id, choir_id, project_id, title, season, status")
      .in("choir_id", choirIds)
  ]);

  if (piecesRes.error && !safeTableMissing(piecesRes.error)) {
    throw piecesRes.error;
  }
  if (programsRes.error && !safeTableMissing(programsRes.error)) {
    throw programsRes.error;
  }

  const programIds: string[] = (programsRes.data || []).map((item: { id: string }) => item.id);

  let programPiecesRows: ProgramPieceRow[] = [];
  if (programIds.length) {
    const piecesByProgram = await db
      .from("concert_program_pieces")
      .select("id, program_id, title, composer, duration, pdf_url, recording_url, sort_order")
      .in("program_id", programIds);

    if (piecesByProgram.error && !safeTableMissing(piecesByProgram.error)) {
      throw piecesByProgram.error;
    }
    programPiecesRows = piecesByProgram.data || [];
  }

  const pieces: RepertoirePiece[] = (piecesRes.data || []).map(
    (item: { id: string; choir_id: string; title: string; composer: string; era: string | null }) => ({
      id: item.id,
      choir_id: item.choir_id,
      title: item.title,
      composer: item.composer,
      era: item.era || undefined
    })
  );

  const groupedProgramPieces = programPiecesRows.reduce<Record<string, ProgramPiece[]>>(
    (acc, row) => {
      const current = acc[row.program_id] || [];
      current.push(
        ...mapProgramPieces([row])
      );
      acc[row.program_id] = current;
      return acc;
    },
    {}
  );

  const programs: ConcertProgram[] = (programsRes.data || []).map(
    (item: {
      id: string;
      choir_id: string;
      project_id: string | null;
      title: string;
      season: string;
      status: string | null;
    }) => ({
      id: item.id,
      choir_id: item.choir_id,
      project_id: item.project_id || undefined,
      title: item.title,
      season: item.season,
      status: mapProgramStatus(item.status),
      pieces: (groupedProgramPieces[item.id] || []).sort((a, b) =>
        a.title.localeCompare(b.title)
      )
    })
  );

  return {
    pieces,
    programs
  };
};
