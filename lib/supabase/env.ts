const missingEnv = (key: string) => {
  throw new Error(`Missing environment variable: ${key}`);
};

export const getSupabaseUrl = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL || missingEnv("NEXT_PUBLIC_SUPABASE_URL");

export const getSupabaseAnonKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || missingEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const getSupabaseServiceRoleKey = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY || missingEnv("SUPABASE_SERVICE_ROLE_KEY");
