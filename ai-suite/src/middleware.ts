import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { authCallbackNextFallback } from "@/lib/auth/auth-callback-next";
import { safeNext } from "@/lib/auth/safe-next";
import { requiredEnv } from "@/lib/env";

/** Supabase may land auth params on Site URL (`/`) instead of `/auth/callback` — forward so the session is created. */
function redirectAuthParamsToCallback(req: NextRequest): NextResponse | null {
  const code = req.nextUrl.searchParams.get("code");
  const tokenHash = req.nextUrl.searchParams.get("token_hash");
  const otpType = req.nextUrl.searchParams.get("type");
  if ((!code && !(tokenHash && otpType)) || req.nextUrl.pathname === "/auth/callback") return null;

  const callback = new URL("/auth/callback", req.url);
  if (code) callback.searchParams.set("code", code);
  if (tokenHash) callback.searchParams.set("token_hash", tokenHash);
  if (otpType) callback.searchParams.set("type", otpType);
  const nextRaw = req.nextUrl.searchParams.get("next");
  callback.searchParams.set(
    "next",
    safeNext(nextRaw ?? authCallbackNextFallback(req.nextUrl.pathname))
  );
  req.nextUrl.searchParams.forEach((value, key) => {
    if (key !== "code" && key !== "next" && key !== "token_hash" && key !== "type") {
      callback.searchParams.set(key, value);
    }
  });
  return NextResponse.redirect(callback);
}

export async function middleware(req: NextRequest) {
  const oauthRedirect = redirectAuthParamsToCallback(req);
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
