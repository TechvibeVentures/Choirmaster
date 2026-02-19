import { getServerSupabaseClient } from "@/lib/supabase/server";

const isAuthSessionMissing = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: string }).name;
  const message = (error as { message?: string }).message || "";
  return name === "AuthSessionMissingError" || message.includes("Auth session missing");
};

export const getCurrentSessionPerson = async () => {
  const supabase = getServerSupabaseClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError && !isAuthSessionMissing(userError)) throw userError;
  if (!user?.email) return { user: null, person: null };

  let personQuery = await supabase
    .from("persons")
    .select("id, email, auth_user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (personQuery.error) throw personQuery.error;

  if (!personQuery.data) {
    personQuery = await supabase
      .from("persons")
      .select("id, email, auth_user_id")
      .eq("email", user.email)
      .maybeSingle();

    if (personQuery.error) throw personQuery.error;

    if (personQuery.data) {
      const anyDb = supabase as any;
      await anyDb.from("persons").update({ auth_user_id: user.id }).eq("id", personQuery.data.id);
    }
  }

  return {
    user,
    person: personQuery.data || null
  };
};
