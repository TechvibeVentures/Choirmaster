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
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Einladung zu Choirmaster</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f6f8fb; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f8fb; margin:0; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
            
            <!-- Header -->
            <tr>
              <td style="padding:28px 32px 12px 32px; text-align:center;">
                <h1 style="margin:0; font-size:24px; line-height:1.3; color:#111827;">
                  Choirmaster
                </h1>
                <p style="margin:8px 0 0 0; font-size:14px; color:#6b7280;">
                  Einladung zu einem Chorprojekt
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:8px 32px 8px 32px;">
                <h2 style="margin:0 0 12px 0; font-size:20px; line-height:1.4; color:#111827;">
                  Du wurdest eingeladen
                </h2>

                <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#374151;">
                  Hallo ${displayName || "there"},
                </p>

                <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#374151;">
                  ${message || "Du wurdest zu einem Chorprojekt eingeladen."}
                </p>

                <p style="margin:0; font-size:14px; line-height:1.6; color:#6b7280;">
                  Projekt
                </p>
                <p style="margin:4px 0 0 0; font-size:15px; line-height:1.6; color:#111827; font-weight:600;">
                  ${invite.project_name || "Projekt"}${invite.choir_name ? " · " + invite.choir_name : ""}
                </p>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td align="center" style="padding:20px 32px 8px 32px;">
                <a
                  href="${joinUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="display:inline-block; background-color:#111827; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; padding:12px 22px; border-radius:8px;"
                >
                  Einladung annehmen
                </a>
              </td>
            </tr>

            <!-- Fallback link -->
            <tr>
              <td style="padding:16px 32px 8px 32px;">
                <p style="margin:0; font-size:13px; line-height:1.6; color:#6b7280;">
                  Falls die Schaltfläche nicht funktioniert, kopiere bitte diesen Link und füge ihn in deinen Browser ein:
                </p>
                <p style="margin:8px 0 0 0; word-break:break-all;">
                  <a href="${joinUrl}" target="_blank" rel="noopener noreferrer" style="font-size:13px; color:#2563eb; text-decoration:underline;">
                    ${joinUrl}
                  </a>
                </p>
              </td>
            </tr>

            <!-- Note -->
            <tr>
              <td style="padding:16px 32px 28px 32px;">
                <p style="margin:0; font-size:12px; line-height:1.6; color:#9ca3af;">
                  Wenn diese Einladung nicht für dich bestimmt ist, kannst du diese E-Mail ignorieren.
                </p>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td style="padding:14px 8px 0 8px; text-align:center;">
                <p style="margin:0; font-size:12px; color:#9ca3af;">
                  Diese E-Mail wurde automatisch von Choirmaster versendet.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
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
