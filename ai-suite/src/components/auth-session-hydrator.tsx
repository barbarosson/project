"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

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

    const authSync =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("auth_sync") === "1";

    function stripAuthSyncParam() {
      if (!authSync || typeof window === "undefined") return;
      const url = new URL(window.location.href);
      url.searchParams.delete("auth_sync");
      const qs = url.searchParams.toString();
      const next = url.pathname + (qs ? `?${qs}` : "") + url.hash;
      window.history.replaceState(null, "", next);
    }

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.refresh();
        stripAuthSyncParam();
        return;
      }
      if (!authSync) return;
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 200));
        const retry = await supabase.auth.getSession();
        if (retry.data.session) {
          router.refresh();
          stripAuthSyncParam();
          break;
        }
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          router.refresh();
          stripAuthSyncParam();
        }
      }
    );
    return () => sub.subscription.unsubscribe();
  }, [router, runtime]);

  return null;
}
