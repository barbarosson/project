"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { safeNext } from "@/lib/auth/safe-next";

/**
 * Supabase sometimes lands OAuth `?code=` on /login instead of /auth/callback.
 * Forward before the user sees a false "not logged in" login form.
 */
export function LoginOAuthCodeForward() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const otpType = searchParams.get("type");
    if (!code && !(tokenHash && otpType)) return;

    const next = safeNext(searchParams.get("next"));
    const target = new URL("/auth/callback", window.location.origin);
    if (code) target.searchParams.set("code", code);
    if (tokenHash) target.searchParams.set("token_hash", tokenHash);
    if (otpType) target.searchParams.set("type", otpType);
    target.searchParams.set("next", next);
    searchParams.forEach((value, key) => {
      if (key !== "code" && key !== "next" && key !== "token_hash" && key !== "type") {
        target.searchParams.set(key, value);
      }
    });
    router.replace(target.pathname + target.search);
  }, [router, searchParams]);

  return null;
}
