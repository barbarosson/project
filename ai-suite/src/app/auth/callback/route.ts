import { NextRequest, NextResponse } from "next/server";

import { isMembershipProfileComplete } from "@/lib/auth/membership-profile";
import { safeNext } from "@/lib/auth/safe-next";
import {
  applyPendingAuthCookies,
  createSupabaseRouteHandlerClient,
  type PendingAuthCookie,
} from "@/lib/supabase/route-handler-client";

function redirectOrigin(request: NextRequest, fallback: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`.replace(/\/+$/, "");
  }
  return fallback.replace(/\/+$/, "");
}

/** Let supabase-js flush deferred Set-Cookie before we copy cookies onto the redirect. */
async function flushAuthCookies(supabase: ReturnType<typeof createSupabaseRouteHandlerClient>) {
  await supabase.auth.getSession();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await supabase.auth.getUser();
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

  const pendingCookies: PendingAuthCookie[] = [];
  const supabase = createSupabaseRouteHandlerClient(request, pendingCookies);

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const login = new URL("/login", siteOrigin);
    login.searchParams.set("error", "auth");
    return NextResponse.redirect(login);
  }

  await flushAuthCookies(supabase);

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    const login = new URL("/login", siteOrigin);
    login.searchParams.set("error", "auth");
    return NextResponse.redirect(login);
  }

  const user = sessionData.session.user;

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
  /** Client hydrator runs `getSession` + `router.refresh` after OAuth lands. */
  destination.searchParams.set("auth_sync", "1");

  const response = NextResponse.redirect(destination);
  applyPendingAuthCookies(response, pendingCookies);
  return response;
}
