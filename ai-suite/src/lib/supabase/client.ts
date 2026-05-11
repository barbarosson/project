import { createBrowserClient } from "@supabase/ssr";

import { optionalEnv } from "@/lib/env";
import type { SupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-types";

function resolveBrowserSupabaseCredentials(runtime?: SupabaseBrowserRuntimeConfig | null): {
  url: string | null;
  anonKey: string | null;
} {
  const url = (runtime?.url?.trim() || optionalEnv("NEXT_PUBLIC_SUPABASE_URL")) ?? null;
  const anonKey = (runtime?.anonKey?.trim() || optionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")) ?? null;
  return { url, anonKey };
}

export function isSupabaseBrowserConfigured(runtime?: SupabaseBrowserRuntimeConfig | null): boolean {
  const { url, anonKey } = resolveBrowserSupabaseCredentials(runtime);
  return Boolean(url && anonKey);
}

/**
 * Prefer `runtime` from `SupabaseBrowserConfigProvider` (server-read env on each request)
 * so hosted deployments work even when NEXT_PUBLIC_* was not present at build time.
 */
export function createSupabaseBrowserClient(runtime?: SupabaseBrowserRuntimeConfig | null) {
  const { url, anonKey } = resolveBrowserSupabaseCredentials(runtime);
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}

