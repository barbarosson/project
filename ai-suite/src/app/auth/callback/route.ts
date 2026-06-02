import { NextRequest, NextResponse } from "next/server";

import { isMembershipProfileComplete } from "@/lib/auth/membership-profile";
import { safeNext } from "@/lib/auth/safe-next";
import { ensureUserEntitlementsBootstrap } from "@/lib/isendai/ensure-user-entitlements";
import { parseReferralCookie } from "@/lib/referrals/ref-cookie";
import {
  ensureReferralProfileForUser,
  logReferralSignupAttribution,
} from "@/lib/referrals/referral-service";
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

function redirectWithCookies(
  url: URL,
  pendingCookies: PendingAuthCookie[]
): NextResponse {
  const response = NextResponse.redirect(url);
  applyPendingAuthCookies(response, pendingCookies);
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = safeNext(url.searchParams.get("next"));
  const siteOrigin = redirectOrigin(request, url.origin);

  const oauthErr =
    url.searchParams.get("error") ||
    url.searchParams.get("error_code") ||
    url.searchParams.get("error_description");
  if (oauthErr && !code) {
    const login = new URL("/login", siteOrigin);
    login.searchParams.set("error", "oauth");
    if (url.searchParams.get("error_description")) {
      login.searchParams.set(
        "detail",
        url.searchParams.get("error_description")!.slice(0, 200)
      );
    }
    return NextResponse.redirect(login);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/", siteOrigin));
  }

  const pendingCookies: PendingAuthCookie[] = [];
  const supabase = createSupabaseRouteHandlerClient(request, pendingCookies);

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    const login = new URL("/login", siteOrigin);
    login.searchParams.set("error", "auth");
    login.searchParams.set("detail", exchangeError.message.slice(0, 200));
    return redirectWithCookies(login, pendingCookies);
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    const login = new URL("/login", siteOrigin);
    login.searchParams.set("error", "auth");
    return redirectWithCookies(login, pendingCookies);
  }

  await ensureUserEntitlementsBootstrap(user.id);

  const referredFromCookie = parseReferralCookie(request.headers.get("cookie"));
  await ensureReferralProfileForUser(user, { referredByCode: referredFromCookie });
  await logReferralSignupAttribution(user, request, { referredByCode: referredFromCookie });

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
  destination.searchParams.set("auth_sync", "1");

  return redirectWithCookies(destination, pendingCookies);
}
