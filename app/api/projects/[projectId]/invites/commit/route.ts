import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { commitInvitesSchema } from "@/lib/apiSchemas";
import { createAndSendInvites } from "@/lib/api/invites/sendInvites";
import {
  VOICE_ORDER,
  getVoiceCapacity,
  normalizeVoiceDistribution
} from "@/lib/domain/voiceDistribution";
import type { Voice } from "@/lib/domain/types";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizeSingerStatus = (value: unknown): "active" | "inactive" | "project_only" => {
  if (value === "active" || value === "inactive" || value === "project_only") {
    return value;
  }
  return "project_only";
};

const normalizeVoice = (value: unknown): Voice | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "soprano" || normalized === "sopran") return "Soprano";
  if (normalized === "alto" || normalized === "alt") return "Alto";
  if (normalized === "tenor") return "Tenor";
  if (normalized === "bass" || normalized === "basso") return "Bass";
  return null;
};

const isActiveSingerMembership = (row: {
  roles: unknown;
  singer_status: unknown;
}) => {
  const roles = Array.isArray(row.roles)
    ? row.roles.filter((role): role is string => typeof role === "string")
    : [];
  return roles.includes("singer") && row.singer_status !== "inactive";
};

type CapacityErrorDetails =
  | { type: "voice_missing_for_capacity" }
  | { type: "voice_capacity_exceeded"; voice: string; current: number; limit: number };

const parseCapacityError = (message: string): CapacityErrorDetails | null => {
  if (message.includes("voice_missing_for_capacity")) {
    return { type: "voice_missing_for_capacity" };
  }

  if (!message.includes("voice_capacity_exceeded|")) return null;
  const [, voice = "", current = "0", limit = "0"] = message.split("|");
  return {
    type: "voice_capacity_exceeded",
    voice,
    current: Number(current),
    limit: Number(limit)
  };
};

const getFirstHeaderValue = (value: string | null) =>
  value ? value.split(",")[0]?.trim() || "" : "";

const getRequestOrigin = (request: Request) => {
  const requestUrl = new URL(request.url);
  const host =
    getFirstHeaderValue(request.headers.get("x-forwarded-host")) ||
    getFirstHeaderValue(request.headers.get("host"));
  if (!host) return requestUrl.origin;
  const proto =
    getFirstHeaderValue(request.headers.get("x-forwarded-proto")) ||
    requestUrl.protocol.replace(":", "") ||
    "https";
  try {
    return new URL(`${proto}://${host}`).origin;
  } catch {
    return requestUrl.origin;
  }
};

type ChoirMembershipRow = {
  person_id: string;
  roles: string[] | null;
  singer_status: "active" | "inactive" | "project_only" | null;
};

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getCurrentSessionPerson();
    if (!session.person?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = commitInvitesSchema.parse(await request.json());
    const requestOrigin = getRequestOrigin(request);

    const serverDb = getServerSupabaseClient();
    const serviceDb = getServiceSupabaseClient();

    const projectRes = await serviceDb
      .from("projects")
      .select("id, choir_id, name")
      .eq("id", params.projectId)
      .single();

    if (projectRes.error || !projectRes.data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const adminCheck = await serverDb.rpc("is_admin", {
      choir: projectRes.data.choir_id
    });

    if (adminCheck.error) throw adminCheck.error;

    if (!adminCheck.data) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const choirRes = await serviceDb
      .from("choirs")
      .select("name, voice_distribution")
      .eq("id", projectRes.data.choir_id)
      .single();

    const choirName = choirRes.data?.name ?? "";
    const choirVoiceDistribution = normalizeVoiceDistribution(
      choirRes.data?.voice_distribution
    );
    const capacityByVoice = new Map<Voice, number>();
    VOICE_ORDER.forEach((voice) => {
      capacityByVoice.set(voice, getVoiceCapacity(choirVoiceDistribution, voice));
    });

    const invites = payload.invites.map((invite) => ({
      ...invite,
      email: normalizeEmail(invite.email)
    }));

    const personIdsFromPayload = Array.from(
      new Set(
        invites
          .map((invite) => invite.person_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      )
    );

    const inviteEmails = Array.from(
      new Set(invites.map((invite) => invite.email).filter((value) => value.length > 0))
    );

    const personsById = new Map<string, { id: string; email: string; voice: Voice | null }>();
    const personsByEmail = new Map<
      string,
      { id: string; email: string; voice: Voice | null }
    >();

    if (personIdsFromPayload.length > 0) {
      const byIdRes = await serviceDb
        .from("persons")
        .select("id, email, voice")
        .in("id", personIdsFromPayload);
      if (byIdRes.error) throw byIdRes.error;
      for (const row of byIdRes.data || []) {
        const normalized = normalizeEmail(row.email || "");
        const mapped = {
          id: row.id,
          email: normalized,
          voice: normalizeVoice(row.voice)
        };
        personsById.set(row.id, mapped);
        if (normalized) personsByEmail.set(normalized, mapped);
      }
    }

    if (inviteEmails.length > 0) {
      const byEmailRes = await serviceDb
        .from("persons")
        .select("id, email, voice")
        .in("email", inviteEmails);
      if (byEmailRes.error) throw byEmailRes.error;
      for (const row of byEmailRes.data || []) {
        const normalized = normalizeEmail(row.email || "");
        const mapped = {
          id: row.id,
          email: normalized,
          voice: normalizeVoice(row.voice)
        };
        personsById.set(row.id, mapped);
        if (normalized) personsByEmail.set(normalized, mapped);
      }
    }

    const choirMembershipsRes = await serviceDb
      .from("choir_memberships")
      .select("person_id, roles, singer_status")
      .eq("choir_id", projectRes.data.choir_id);
    if (choirMembershipsRes.error) throw choirMembershipsRes.error;

    const choirMembershipRows = (choirMembershipsRes.data || []) as ChoirMembershipRow[];
    const membershipPersonIds = Array.from(
      new Set(
        choirMembershipRows
          .map((row) => row.person_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      )
    );

    const membershipVoicesByPersonId = new Map<string, Voice | null>();
    if (membershipPersonIds.length > 0) {
      const choirMembershipPersonsRes = await serviceDb
        .from("persons")
        .select("id, voice")
        .in("id", membershipPersonIds);
      if (choirMembershipPersonsRes.error) throw choirMembershipPersonsRes.error;
      for (const row of choirMembershipPersonsRes.data || []) {
        membershipVoicesByPersonId.set(row.id, normalizeVoice(row.voice));
      }
    }

    const activeSingerVoiceByPersonId = new Map<string, Voice>();
    const reservedByVoice = new Map<Voice, number>();
    VOICE_ORDER.forEach((voice) => reservedByVoice.set(voice, 0));

    for (const row of choirMembershipRows) {
      if (!isActiveSingerMembership(row)) continue;
      const voice = membershipVoicesByPersonId.get(row.person_id) ?? null;
      if (!voice) continue;
      activeSingerVoiceByPersonId.set(row.person_id, voice);
      reservedByVoice.set(voice, (reservedByVoice.get(voice) ?? 0) + 1);
    }

    const reservedInviteEmails = new Set<string>();
    const pendingInvitesRes = await serviceDb
      .from("project_invites")
      .select("email, voice")
      .eq("choir_id", projectRes.data.choir_id)
      .in("status", ["pending", "sent"])
      .gt("expires_at", new Date().toISOString());
    if (pendingInvitesRes.error) throw pendingInvitesRes.error;
    for (const invite of pendingInvitesRes.data || []) {
      const normalizedEmail = normalizeEmail(invite.email || "");
      if (normalizedEmail) reservedInviteEmails.add(normalizedEmail);
      const voice = normalizeVoice(invite.voice);
      if (!voice) continue;
      reservedByVoice.set(voice, (reservedByVoice.get(voice) ?? 0) + 1);
    }

    const reserveVoiceCapacity = (voice: Voice): CapacityErrorDetails | null => {
      const current = reservedByVoice.get(voice) ?? 0;
      const limit = capacityByVoice.get(voice) ?? 0;
      if (current >= limit) {
        return { type: "voice_capacity_exceeded", voice, current, limit };
      }
      reservedByVoice.set(voice, current + 1);
      return null;
    };

    const anyDb = serviceDb as any;
    const invitesForEmail = [] as typeof invites;
    let attached = 0;

    for (const invite of invites) {
      const personById = invite.person_id ? personsById.get(invite.person_id) : undefined;
      const personByEmail = personsByEmail.get(invite.email);
      const person = personById || personByEmail;

      if (!person) {
        if (!reservedInviteEmails.has(invite.email)) {
          const inviteVoice = normalizeVoice(invite.voice);
          if (!inviteVoice) {
            return NextResponse.json(
              { error: "voice_missing_for_capacity" },
              { status: 409 }
            );
          }
          const reservationError = reserveVoiceCapacity(inviteVoice);
          if (reservationError?.type === "voice_capacity_exceeded") {
            return NextResponse.json(
              {
                error: "voice_capacity_exceeded",
                capacity: {
                  voice: reservationError.voice,
                  current: reservationError.current,
                  limit: reservationError.limit
                }
              },
              { status: 409 }
            );
          }
          reservedInviteEmails.add(invite.email);
        }
        invitesForEmail.push(invite);
        continue;
      }

      const inviteRoles = Array.isArray(invite.roles)
        ? invite.roles.filter((role): role is string => typeof role === "string" && role.length > 0)
        : [];
      const roles = inviteRoles.length ? Array.from(new Set([...inviteRoles, "singer"])) : ["singer"];
      const singerStatus = normalizeSingerStatus(invite.singer_status);
      const shouldBeActiveSinger = roles.includes("singer") && singerStatus !== "inactive";
      const existingActiveVoice = activeSingerVoiceByPersonId.get(person.id) ?? null;
      const effectiveVoice = person.voice;

      if (shouldBeActiveSinger) {
        if (!effectiveVoice) {
          return NextResponse.json(
            { error: "voice_missing_for_capacity" },
            { status: 409 }
          );
        }
        if (!existingActiveVoice) {
          const reservationError = reserveVoiceCapacity(effectiveVoice);
          if (reservationError?.type === "voice_capacity_exceeded") {
            return NextResponse.json(
              {
                error: "voice_capacity_exceeded",
                capacity: {
                  voice: reservationError.voice,
                  current: reservationError.current,
                  limit: reservationError.limit
                }
              },
              { status: 409 }
            );
          }
          activeSingerVoiceByPersonId.set(person.id, effectiveVoice);
        }
      } else if (existingActiveVoice) {
        activeSingerVoiceByPersonId.delete(person.id);
        reservedByVoice.set(
          existingActiveVoice,
          Math.max(0, (reservedByVoice.get(existingActiveVoice) ?? 0) - 1)
        );
      }

      if (shouldBeActiveSinger) {
        const capacityCheck = await anyDb.rpc("assert_choir_voice_capacity", {
          p_choir_id: projectRes.data.choir_id,
          p_voice: effectiveVoice,
          p_exclude_person_id: person.id
        });

        if (capacityCheck.error) {
          const parsed = parseCapacityError(capacityCheck.error.message || "");
          if (parsed?.type === "voice_missing_for_capacity") {
            return NextResponse.json(
              { error: "voice_missing_for_capacity" },
              { status: 409 }
            );
          }

          if (parsed?.type === "voice_capacity_exceeded") {
            return NextResponse.json(
              {
                error: "voice_capacity_exceeded",
                capacity: {
                  voice: parsed.voice,
                  current: parsed.current,
                  limit: parsed.limit
                }
              },
              { status: 409 }
            );
          }

          throw capacityCheck.error;
        }
      }

      const membershipRes = await serviceDb
        .from("choir_memberships")
        .upsert(
          {
            choir_id: projectRes.data.choir_id,
            person_id: person.id,
            roles,
            singer_status: singerStatus
          },
          { onConflict: "choir_id,person_id" }
        )
        .select("id")
        .single();
      if (membershipRes.error) throw membershipRes.error;

      const participantRes = await serviceDb
        .from("project_participants")
        .upsert(
          {
            project_id: params.projectId,
            person_id: person.id,
            invite_status: "confirmed"
          },
          { onConflict: "project_id,person_id" }
        )
        .select("id")
        .single();
      if (participantRes.error) throw participantRes.error;

      attached += 1;
    }

    let result = {
      sent: 0,
      created: 0,
      skipped: invitesForEmail.length,
      invitesToSend: [] as Array<{
        email: string;
        token: string;
        first_name: string;
        last_name: string;
        project_name: string;
        choir_name: string;
      }>
    };

    if (invitesForEmail.length > 0) {
      result = await createAndSendInvites(
        serviceDb,
        {
          projectId: params.projectId,
          choirId: projectRes.data.choir_id,
          projectName: projectRes.data.name ?? "",
          choirName,
          createdByPersonId: session.person.id,
          origin: requestOrigin
        },
        invitesForEmail
      );
    }

    if (result.invitesToSend.length === 0 && attached === 0 && result.skipped === invites.length) {
      return NextResponse.json({
        sent: 0,
        created: 0,
        attached: 0,
        skipped: invites.length,
        error: "No singers were added or invited"
      }, { status: 409 });
    }

    return NextResponse.json({
      attached,
      sent: result.sent,
      created: result.created,
      skipped: result.skipped
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const invalidInviteRows = error.issues
        .filter((issue) => issue.path?.[0] === "invites" && issue.path?.[2] === "email")
        .map((issue) => Number(issue.path?.[1]))
        .filter((index) => Number.isFinite(index));

      return NextResponse.json(
        {
          error: "Invalid payload",
          details: error.issues,
          invalidInviteRows
        },
        { status: 400 }
      );
    }
    console.error("projects/[projectId]/invites/commit error", error);
    return NextResponse.json(
      { error: "Failed to send invites" },
      { status: 500 }
    );
  }
}
