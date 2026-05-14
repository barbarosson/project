import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { optionalEnv, requiredEnv } from "@/lib/env";

export function createSupabaseAdminClient(): SupabaseClient {
  return createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Same as {@link createSupabaseAdminClient} but returns null if service role is unset (typical local dev gap). */
export function createSupabaseAdminClientOrNull(): SupabaseClient | null {
  const url =
    optionalEnv("NEXT_PUBLIC_SUPABASE_URL")?.trim() ||
    optionalEnv("SUPABASE_URL")?.trim() ||
    null;
  const key = optionalEnv("SUPABASE_SERVICE_ROLE_KEY")?.trim() || null;
  if (!url || !key) return null;
  return createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

