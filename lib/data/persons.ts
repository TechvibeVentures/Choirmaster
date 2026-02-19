import type { Person, PersonSettings } from "@/lib/domain/types";
import { normalizeExperience, normalizeSettings, safeTableMissing } from "@/lib/data/common";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const isAuthSessionMissing = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: string }).name;
  const message = (error as { message?: string }).message || "";
  return name === "AuthSessionMissingError" || message.includes("Auth session missing");
};

export const getCurrentAuthUser = async () => {
  const supabase = getServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error && !isAuthSessionMissing(error)) throw error;
  return user;
};

export const getCurrentPerson = async () => {
  const supabase = getServerSupabaseClient();
  const user = await getCurrentAuthUser();
  if (!user?.email) return null;

  let query: any = await supabase
    .from("persons")
    .select("id, email, first_name, last_name, phone, city, experience_level, tags")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (query.error) {
    throw query.error;
  }

  if (!query.data) {
    query = await supabase
      .from("persons")
      .select("id, email, first_name, last_name, phone, city, experience_level, tags")
      .eq("email", user.email)
      .maybeSingle();

    if (query.error) {
      throw query.error;
    }

    if (query.data) {
      await supabase
        .from("persons")
        .update({ auth_user_id: user.id })
        .eq("id", query.data.id);
    }
  }

  if (!query.data) return null;

  const row = query.data;
  const person: Person = {
    id: row.id,
    email: row.email,
    first_name: row.first_name || "",
    last_name: row.last_name || "",
    phone: row.phone || undefined,
    city: row.city || "",
    experience_level: normalizeExperience(row.experience_level),
    tags: row.tags || [],
    roles: ["singer"]
  };

  return person;
};

export const getPersonSettings = async (
  personId: string,
  fallbackChoirId: string
): Promise<PersonSettings> => {
  const supabase = getServerSupabaseClient();
  const anyDb = supabase as any;
  const { data, error } = await anyDb
    .from("person_settings")
    .select(
      "person_id, language, timezone, notification_prefs, session_days, mfa_enabled, active_choir_id"
    )
    .eq("person_id", personId)
    .maybeSingle();

  if (error && !safeTableMissing(error)) {
    throw error;
  }

  return normalizeSettings(data || { person_id: personId }, fallbackChoirId);
};

export const getPersonsByIds = async (personIds: string[]) => {
  if (!personIds.length) return [] as Person[];

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("persons")
    .select("id, email, first_name, last_name, phone, city, experience_level, tags")
    .in("id", personIds);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    email: row.email,
    first_name: row.first_name || "",
    last_name: row.last_name || "",
    phone: row.phone || undefined,
    city: row.city || "",
    experience_level: normalizeExperience(row.experience_level),
    tags: row.tags || [],
    roles: ["singer"]
  })) as Person[];
};
