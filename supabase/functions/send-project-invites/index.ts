// Supabase Edge Function: send project invite emails via Resend
// Invoked by Next.js API after creating project_invites records

const RESEND_API_URL = "https://api.resend.com/emails";

type InvitePayload = {
  email: string;
  token: string;
  first_name?: string;
  last_name?: string;
  project_name?: string;
  choir_name?: string;
};

type RequestBody = {
  invites: InvitePayload[];
  origin: string;
  subject?: string;
  message?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

  if (!apiKey) {
    console.error("RESEND_API_KEY not set");
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await req.json()) as RequestBody;
    const { invites, origin, subject = "Einladung zum Chorprojekt", message = "" } = body;

    if (!invites?.length || !origin) {
      return new Response(
        JSON.stringify({ error: "Missing invites or origin" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const invite of invites) {
      const joinUrl = `${origin.replace(/\/$/, "")}/join/${encodeURIComponent(invite.token)}`;
      const displayName = [invite.first_name, invite.last_name].filter(Boolean).join(" ") || invite.email;
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #334155; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>Hallo ${displayName},</p>
  <p>${message || "Du wurdest zu einem Chorprojekt eingeladen."}</p>
  <p><strong>${invite.project_name || "Projekt"}</strong>${invite.choir_name ? ` · ${invite.choir_name}` : ""}</p>
  <p style="margin-top: 24px;">
    <a href="${joinUrl}" style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600;">Einladung annehmen</a>
  </p>
  <p style="margin-top: 24px; font-size: 14px; color: #64748b;">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
  <p style="font-size: 12px; word-break: break-all; color: #64748b;">${joinUrl}</p>
</body>
</html>`;

      const res = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: invite.email,
          subject,
          html,
        }),
      });

      if (res.ok) {
        results.push({ email: invite.email, success: true });
      } else {
        const errBody = await res.text();
        results.push({ email: invite.email, success: false, error: errBody });
      }
    }

    return new Response(
      JSON.stringify({ sent: results.filter((r) => r.success).length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-project-invites error", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
