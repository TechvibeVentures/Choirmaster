import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { availabilityBatchSchema } from "@/lib/apiSchemas";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

type AvailabilityStatus = "yes" | "no" | "unknown";

type AvailabilityEntry = {
  rehearsalId: string;
  status: AvailabilityStatus;
};

const dedupeEntries = (entries: AvailabilityEntry[]) => {
  const byRehearsal = new Map<string, AvailabilityStatus>();
  entries.forEach((entry) => {
    byRehearsal.set(entry.rehearsalId, entry.status);
  });
  return Array.from(byRehearsal.entries()).map(([rehearsalId, status]) => ({
    rehearsalId,
    status
  }));
};

export async function PUT(request: Request) {
  try {
    const session = await getCurrentSessionPerson();
    if (!session.person?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = availabilityBatchSchema.parse(await request.json());
    const targetPersonId = payload.personId || session.person.id;

    const serverDb = getServerSupabaseClient();
    const serviceDb = getServiceSupabaseClient();

    const projectRes = await serviceDb
      .from("projects")
      .select("id, choir_id")
      .eq("id", payload.projectId)
      .maybeSingle();

    if (projectRes.error) throw projectRes.error;
    if (!projectRes.data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (targetPersonId !== session.person.id) {
      const adminCheck = await serverDb.rpc("is_admin", {
        choir: projectRes.data.choir_id
      });

      if (adminCheck.error) throw adminCheck.error;
      if (!adminCheck.data) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const participantRes = await serviceDb
      .from("project_participants")
      .select("id")
      .eq("project_id", payload.projectId)
      .eq("person_id", targetPersonId)
      .maybeSingle();

    if (participantRes.error) throw participantRes.error;
    if (!participantRes.data) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dedupedEntries = dedupeEntries(payload.entries);
    const rehearsalIds = dedupedEntries.map((entry) => entry.rehearsalId);

    const rehearsalsRes = await serviceDb
      .from("rehearsals")
      .select("id, project_id")
      .in("id", rehearsalIds);

    if (rehearsalsRes.error) throw rehearsalsRes.error;

    const rehearsals = rehearsalsRes.data || [];
    const validIds = new Set(
      rehearsals
        .filter((item: { id: string; project_id: string }) => item.project_id === payload.projectId)
        .map((item: { id: string; project_id: string }) => item.id)
    );
    const invalidRehearsalIds = rehearsalIds.filter((id) => !validIds.has(id));

    if (invalidRehearsalIds.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid rehearsals for project",
          invalidRehearsalIds
        },
        { status: 422 }
      );
    }

    const updatedByKind = targetPersonId === session.person.id ? "singer" : "admin";

    const writeRows = dedupedEntries.map((entry) => ({
      rehearsal_id: entry.rehearsalId,
      person_id: targetPersonId,
      status: entry.status,
      updated_by_person_id: session.person!.id,
      updated_by_kind: updatedByKind
    }));

    const writeRes = await (serverDb as any)
      .from("availability")
      .upsert(writeRows, { onConflict: "rehearsal_id,person_id" })
      .select("rehearsal_id, person_id, status");

    if (writeRes.error) {
      if (writeRes.error.code === "42501") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      throw writeRes.error;
    }

    const rows = writeRes.data || [];

    return NextResponse.json({
      ok: true,
      projectId: payload.projectId,
      personId: targetPersonId,
      updated: rows.length,
      rows
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", details: error.issues },
        { status: 400 }
      );
    }
    console.error("availability/batch PUT error", error);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
}
