"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Supabase sometimes lands OAuth `?code=` on /login instead of /auth/callback.
 * Forward before the user sees a false "not logged in" login form.
 */
export function LoginOAuthCodeForward() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;

    const next = searchParams.get("next") ?? "/";
    const target = new URL("/auth/callback", window.location.origin);
    target.searchParams.set("code", code);
    target.searchParams.set("next", next);
    searchParams.forEach((value, key) => {
      if (key !== "code" && key !== "next") target.searchParams.set(key, value);
    });
    router.replace(target.pathname + target.search);
  }, [router, searchParams]);

  return null;
}
