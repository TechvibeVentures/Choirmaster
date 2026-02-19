"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/supabase-types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const getBrowserSupabaseClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      getSupabaseUrl(),
      getSupabaseAnonKey()
    );
  }
  return browserClient as any;
};
