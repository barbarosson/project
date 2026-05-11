import { createBrowserClient } from "@supabase/ssr";

import { optionalEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const url = optionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = optionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

