import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl
} from "@/lib/supabase/env";

let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

export const getServiceSupabaseClient = () => {
  if (!serviceClient) {
    serviceClient = createClient<Database>(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return serviceClient as any;
};
