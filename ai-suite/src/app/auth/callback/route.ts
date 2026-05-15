import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { isMembershipProfileComplete } from "@/lib/auth/membership-profile";
import { safeNext } from "@/lib/auth/safe-next";
import { ensureUserEntitlementsBootstrap } from "@/lib/isendai/ensure-user-entitlements";
import { requiredEnv } from "@/lib/env";

function redirectOrigin(request: NextRequest, fallback: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`.replace(/\/+$/, "");
  }
  return fallback.replace(/\/+$/, "");
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const nextPath = safeNext(url.searchParams.get("next"));
  const siteOrigin = redirectOrigin(request, origin);

  const oauthErr =
    url.searchParams.get("error") ||
    url.searchParams.get("error_code") ||
    url.searchParams.get("error_description");
  if (oauthErr && !code) {
    const login = new URL("/login", siteOrigin);
    login.searchParams.set("error", "oauth");
    return NextResponse.redirect(login);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/", siteOrigin));
  }

  /**
   * Official Supabase SSR pattern: bind cookies to the redirect response **from the start**
   * so every `setAll` call by `exchangeCodeForSession` flushes to the response headers.
   * Without this, OAuth cookies (Facebook/Google) silently never reach the browser.
   *
   * Placeholder URL — we rewrite to the real destination after we know the user state.
   */
  let response = NextResponse.redirect(new URL("/", siteOrigin));

  const supabase = createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...(options ?? {}) });
            response.cookies.set({ name, value, ...(options ?? {}) });
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const login = new URL("/login", siteOrigin);
    login.searchParams.set("error", "auth");
    const loginResponse = NextResponse.redirect(login);
    response.cookies.getAll().forEach((c) => {
      loginResponse.cookies.set(c.name, c.value, c);
    });
    return loginResponse;
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    const login = new URL("/login", siteOrigin);
    login.searchParams.set("error", "auth");
    return NextResponse.redirect(login);
  }

  /**
   * Bootstrap entitlements row for new OAuth users so `/account` isn't empty.
   * Idempotent (INSERT ... ON CONFLICT DO NOTHING) — safe to run on every sign-in.
   */
  await ensureUserEntitlementsBootstrap(user.id);

  let destinationPath: string;
  if (
    nextPath === "/auth/update-password" ||
    nextPath.startsWith("/auth/update-password/")
  ) {
    destinationPath = nextPath || "/auth/update-password";
  } else if (!isMembershipProfileComplete(user.user_metadata)) {
    const afterProfile = nextPath && nextPath !== "/" ? nextPath : "/";
    destinationPath = `/account/profile?next=${encodeURIComponent(afterProfile)}`;
  } else {
    destinationPath = nextPath || "/";
  }

  const destination = new URL(destinationPath, siteOrigin);
  if (!user.email?.trim()) {
    destination.searchParams.set("oauth_email", "missing");
  }

  /** Re-emit with the final destination, preserving cookies we already accumulated. */
  const finalResponse = NextResponse.redirect(destination);
  response.cookies.getAll().forEach((c) => {
    finalResponse.cookies.set(c.name, c.value, c);
  });
  response = finalResponse;
  return response;
}
