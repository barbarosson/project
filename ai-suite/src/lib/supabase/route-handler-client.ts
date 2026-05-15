import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import { requiredEnv } from "@/lib/env";

export type PendingAuthCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * Route handlers must attach auth cookies to the **redirect response** (not only `cookies()`),
 * or the browser never receives the session after OAuth (Facebook/Google).
 */
export function createSupabaseRouteHandlerClient(
  request: NextRequest,
  pendingCookies: PendingAuthCookie[]
) {
  return createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options: options ?? {} });
          });
        },
      },
    }
  );
}

export function applyPendingAuthCookies(
  response: NextResponse,
  pendingCookies: PendingAuthCookie[]
) {
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
}
