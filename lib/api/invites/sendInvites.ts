import { createHash, randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";
import { normalizeVoice } from "@/lib/data/common";

const splitName = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned) return { first: "", last: "" };
  const [first, ...rest] = cleaned.split(/\s+/);
  return { first, last: rest.join(" ") };
};

export const tokenHash = (rawToken: string) =>
  createHash("sha256").update(rawToken.trim(), "utf8").digest("hex");

type InviteInput = {
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  voice?: string | null;
  singer_status?: string;
  roles?: string[];
};

export async function createAndSendInvites(
  serviceDb: SupabaseClient<Database>,
  params: {
    projectId: string;
    choirId: string;
    projectName: string;
    choirName: string;
    createdByPersonId: string;
  },
  invites: InviteInput[]
) {
  const invitesToSend: Array<{
    email: string;
    token: string;
    first_name: string;
    last_name: string;
    project_name: string;
    choir_name: string;
  }> = [];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);
  const seenEmails = new Set<string>();

  for (const invite of invites) {
    const email = invite.email.trim().toLowerCase();
    if (!email) continue;
    if (seenEmails.has(email)) continue;
    seenEmails.add(email);

    const derived = splitName(invite.name || "");
    const firstName = invite.first_name || derived.first || "";
    const lastName = invite.last_name || derived.last || "";
    const voice = invite.voice ? normalizeVoice(invite.voice) : null;

    const rawToken = randomBytes(32).toString("base64url");
    const hash = tokenHash(rawToken);

    const { error: insertError } = await serviceDb
      .from("project_invites")
      .insert({
        project_id: params.projectId,
        choir_id: params.choirId,
        email,
        first_name: firstName,
        last_name: lastName,
        voice,
        roles: ["singer"],
        singer_status: invite.singer_status || "project_only",
        status: "pending",
        token_hash: hash,
        expires_at: expiresAt.toISOString(),
        created_by_person_id: params.createdByPersonId
      });

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: updatedInvite, error: updateError } = await serviceDb
          .from("project_invites")
          .update({
            first_name: firstName,
            last_name: lastName,
            voice,
            roles: ["singer"],
            singer_status: invite.singer_status || "project_only",
            status: "pending",
            token_hash: hash,
            expires_at: expiresAt.toISOString(),
            sent_at: null,
            accepted_at: null,
            created_by_person_id: params.createdByPersonId
          })
          .eq("project_id", params.projectId)
          .eq("email", email)
          .in("status", ["pending", "sent"])
          .select("id")
          .maybeSingle();

        if (updateError) throw updateError;
        if (!updatedInvite) continue;
      } else {
        throw insertError;
      }
    }

    invitesToSend.push({
      email,
      token: rawToken,
      first_name: firstName,
      last_name: lastName,
      project_name: params.projectName,
      choir_name: params.choirName
    });
  }

  if (invitesToSend.length === 0) {
    return { sent: 0, created: 0, skipped: invites.length, invitesToSend: [] };
  }

  const origin =
    typeof process.env.NEXT_PUBLIC_APP_URL === "string"
      ? process.env.NEXT_PUBLIC_APP_URL
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

  const { data: fnData, error: fnError } = await serviceDb.functions.invoke(
    "send-project-invites",
    {
      body: {
        invites: invitesToSend,
        origin,
        subject: "Einladung zum Chorprojekt",
        message: ""
      }
    }
  );

  if (fnError) {
    throw new Error(`Failed to send emails: ${fnError.message}`);
  }

  const results = (fnData?.results as Array<{ email: string; success: boolean }>) ?? [];
  const sentEmails = new Set(
    results.filter((r) => r.success).map((r) => r.email.trim().toLowerCase())
  );

  if (sentEmails.size === 0) {
    throw new Error("Failed to send invites: no emails were sent");
  }

  const sentTokenHashes = invitesToSend
    .filter((inv) => sentEmails.has(inv.email))
    .map((inv) => tokenHash(inv.token));

  if (sentTokenHashes.length > 0) {
    const { error: markSentError } = await serviceDb
      .from("project_invites")
      .update({
        status: "sent",
        sent_at: new Date().toISOString()
      })
      .in("token_hash", sentTokenHashes);

    if (markSentError) throw markSentError;
  }

  return {
    sent: sentEmails.size,
    created: invitesToSend.length,
    skipped: invites.length - invitesToSend.length,
    invitesToSend
  };
}
