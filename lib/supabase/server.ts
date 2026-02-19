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
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Parameters<typeof cookieStore.set>[2]) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // In server components cookies may be read-only.
          }
        },
        remove(name: string, options: Parameters<typeof cookieStore.set>[2]) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch {
            // In server components cookies may be read-only.
          }
        }
      }
    }
  ) as any;
};
