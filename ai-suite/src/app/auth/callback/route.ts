import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { safeNext } from "@/lib/auth/safe-next";
import { requiredEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const nextPath = safeNext(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/", origin));
  }

  const redirectTarget = new URL(nextPath || "/", origin);

  const response = NextResponse.redirect(redirectTarget);

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
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  let destinationPath: string;
  if (
    nextPath === "/auth/update-password" ||
    nextPath.startsWith("/auth/update-password/")
  ) {
    destinationPath = nextPath || "/auth/update-password";
  } else {
    destinationPath = nextPath || "/";
  }

  response.headers.set("Location", new URL(destinationPath, origin).toString());

  return response;
}
