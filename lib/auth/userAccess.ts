export const ADMIN_ROLE_VALUES = ["chairman", "conductor", "manager"] as const;

export type UserKind = "admin" | "singer" | "setup";

const ADMIN_ROLES = new Set<string>(ADMIN_ROLE_VALUES);

const decodePart = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const normalizeEmail = (value: string | null | undefined) =>
  (value || "").trim().toLowerCase();

export const getJoinTokenFromPath = (path: string | null | undefined) => {
  const safePath = (path || "").trim();
  if (!safePath.startsWith("/") || safePath.startsWith("//")) return "";

  const pathname = safePath.split("?")[0] || "";
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "join" || segments.length < 2) return "";

  return decodePart(segments.slice(1).join("/")).trim();
};

const normalizeRoles = (roles: unknown) => {
  if (!Array.isArray(roles)) return [];
  return roles.filter((role): role is string => typeof role === "string");
};

export const classifyUserKindFromMemberships = (
  memberships: Array<{ roles?: unknown }>
): UserKind => {
  let hasSinger = false;
  let hasAdmin = false;

  for (const membership of memberships) {
    const roles = normalizeRoles(membership.roles);
    if (roles.includes("singer")) hasSinger = true;
    if (roles.some((role) => ADMIN_ROLES.has(role))) hasAdmin = true;
  }

  if (hasAdmin) return "admin";
  if (hasSinger) return "singer";
  return "setup";
};

export const hasAnyAdminRole = (roles: unknown) =>
  normalizeRoles(roles).some((role) => ADMIN_ROLES.has(role));
