import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/supabase-types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export const getServerSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            );
          } catch {
            // In server components cookies may be read-only.
          }
        }
      }
    }
  ) as any;
};
