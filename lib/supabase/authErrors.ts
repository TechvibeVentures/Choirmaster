const getErrorText = (error: unknown) => {
  if (!error || typeof error !== "object") return "";

  const maybeMessage = (error as { message?: unknown }).message;
  if (typeof maybeMessage === "string") {
    return maybeMessage.trim();
  }

  const maybeCode = (error as { code?: unknown }).code;
  if (typeof maybeCode === "string") {
    return maybeCode.trim();
  }

  return "";
};

export const formatMagicLinkError = (error: unknown) => {
  const raw = getErrorText(error);
  const normalized = raw.toLowerCase();

  if (!raw) {
    return "Magic Link konnte nicht gesendet werden.";
  }

  if (
    normalized.includes("redirect") &&
    normalized.includes("not allowed")
  ) {
    return "Magic Link konnte nicht gesendet werden: Redirect URL nicht erlaubt. Prüfe Supabase Auth > URL Configuration.";
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("security purposes")
  ) {
    return "Magic Link konnte nicht gesendet werden: Zu viele Versuche. Bitte warte kurz und versuche es erneut.";
  }

  if (normalized.includes("email provider is disabled")) {
    return "Magic Link konnte nicht gesendet werden: E-Mail Provider ist in Supabase deaktiviert.";
  }

  if (
    normalized.includes("error sending magic link email") ||
    normalized.includes("unexpected_failure")
  ) {
    return "Magic Link konnte nicht gesendet werden: Supabase Auth konnte keine E-Mail zustellen. Prüfe in Supabase Authentication die SMTP/Email-Konfiguration (z.B. Resend) und die Auth-Logs.";
  }

  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "Magic Link konnte nicht gesendet werden: Netzwerkfehler. Bitte Verbindung und Supabase URL prüfen.";
  }

  return `Magic Link konnte nicht gesendet werden: ${raw}`;
};
