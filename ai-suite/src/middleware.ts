import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { safeNext } from "@/lib/auth/safe-next";
import { requiredEnv } from "@/lib/env";

/** Supabase may land `?code=` on Site URL (`/`) instead of `/auth/callback` — forward so the session is created. */
function redirectOAuthCodeToCallback(req: NextRequest): NextResponse | null {
  const code = req.nextUrl.searchParams.get("code");
  if (!code || req.nextUrl.pathname === "/auth/callback") return null;

  const callback = new URL("/auth/callback", req.url);
  callback.searchParams.set("code", code);
  const nextRaw = req.nextUrl.searchParams.get("next");
  const fallbackNext = req.nextUrl.pathname === "/" ? "/" : req.nextUrl.pathname;
  callback.searchParams.set("next", safeNext(nextRaw ?? fallbackNext));
  req.nextUrl.searchParams.forEach((value, key) => {
    if (key !== "code" && key !== "next") callback.searchParams.set(key, value);
  });
  return NextResponse.redirect(callback);
}

export async function middleware(req: NextRequest) {
  const oauthRedirect = redirectOAuthCodeToCallback(req);
  if (oauthRedirect) return oauthRedirect;

  const res = NextResponse.next();

  const supabase = createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return res;
}

export const config = {
  /** Skip all `/_next/*` (HMR, webpack/turbopack chunks, react-refresh, etc.) — running middleware there breaks dev with 500s. */
  matcher: [
    "/((?!_next(?:/|$)|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2)$).*)",
  ],
};
