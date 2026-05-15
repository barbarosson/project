import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { isMembershipProfileComplete } from "@/lib/auth/membership-profile";
import { safeNext } from "@/lib/auth/safe-next";
import { requiredEnv } from "@/lib/env";

function redirectOrigin(request: NextRequest, fallback: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`.replace(/\/+$/, "");
  }
  return fallback.replace(/\/+$/, "");
}

/** Allow deferred supabase-js auth listeners to flush Set-Cookie in serverless (see supabase-js #2037). */
async function flushAuthCookies(supabase: ReturnType<typeof createServerClient>) {
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

  const cookieStore = await cookies();
  const supabase = createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Route handlers should allow set; ignore if not writable.
          }
        },
      },
    }
  );

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

  return NextResponse.redirect(destination);
}
