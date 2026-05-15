import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { isMembershipProfileComplete } from "@/lib/auth/membership-profile";
import { safeNext } from "@/lib/auth/safe-next";
import { requiredEnv } from "@/lib/env";

function redirectOrigin(request: NextRequest, fallback: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (process.env.NODE_ENV !== "development" && forwardedHost) {
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

  const oauthErr =
    url.searchParams.get("error") ||
    url.searchParams.get("error_code") ||
    url.searchParams.get("error_description");
  if (oauthErr && !code) {
    const login = new URL("/login", origin);
    login.searchParams.set("error", "oauth");
    return NextResponse.redirect(login);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/", origin));
  }

  const siteOrigin = redirectOrigin(request, origin);
  const response = NextResponse.redirect(new URL(nextPath || "/", siteOrigin));

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
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", siteOrigin));
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let destinationPath: string;
  if (
    nextPath === "/auth/update-password" ||
    nextPath.startsWith("/auth/update-password/")
  ) {
    destinationPath = nextPath || "/auth/update-password";
  } else if (user && !isMembershipProfileComplete(user.user_metadata)) {
    const afterProfile = nextPath && nextPath !== "/" ? nextPath : "/";
    destinationPath = `/account/profile?next=${encodeURIComponent(afterProfile)}`;
  } else {
    destinationPath = nextPath || "/";
  }

  const destination = new URL(destinationPath, siteOrigin);
  if (user && !user.email?.trim()) {
    destination.searchParams.set("oauth_email", "missing");
  }
  response.headers.set("Location", destination.toString());

  return response;
}
