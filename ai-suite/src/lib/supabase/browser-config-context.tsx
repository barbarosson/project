"use client";

import * as React from "react";

import type { SupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-types";

export type { SupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-types";

const SupabaseBrowserConfigContext = React.createContext<SupabaseBrowserRuntimeConfig | null>(null);

export function SupabaseBrowserConfigProvider({
  children,
  url,
  anonKey,
}: {
  children: React.ReactNode;
  url: string | null;
  anonKey: string | null;
}) {
  const value = React.useMemo<SupabaseBrowserRuntimeConfig>(
    () => ({
      url: url?.trim() ? url.trim() : null,
      anonKey: anonKey?.trim() ? anonKey.trim() : null,
    }),
    [url, anonKey]
  );

  return (
    <SupabaseBrowserConfigContext.Provider value={value}>{children}</SupabaseBrowserConfigContext.Provider>
  );
}

export function useSupabaseBrowserRuntimeConfig(): SupabaseBrowserRuntimeConfig {
  return React.useContext(SupabaseBrowserConfigContext) ?? { url: null, anonKey: null };
}
