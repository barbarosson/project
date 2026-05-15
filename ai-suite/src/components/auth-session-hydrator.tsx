"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  createSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";

/**
 * After OAuth redirect, ensure the browser client picks up cookies and RSC cache refreshes.
 */
export function AuthSessionHydrator() {
  const router = useRouter();
  const runtime = useSupabaseBrowserRuntimeConfig();

  React.useEffect(() => {
    if (!isSupabaseBrowserConfigured(runtime)) return;
    const supabase = createSupabaseBrowserClient(runtime);
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.refresh();
      }
    });
  }, [router, runtime]);

  return null;
}
