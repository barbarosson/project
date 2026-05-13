import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { ANON_COOKIE, ANON_COOKIE_MAX_AGE, ANON_ID_REQUEST_HEADER } from "@/lib/isendai/anon-cookie";
import { requiredEnv } from "@/lib/env";

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.delete(ANON_ID_REQUEST_HEADER);

  const cookieAnon = req.cookies.get(ANON_COOKIE)?.value?.trim();
  const anonForThisRequest =
    cookieAnon && cookieAnon.length > 10 ? cookieAnon : crypto.randomUUID();

  requestHeaders.set(ANON_ID_REQUEST_HEADER, anonForThisRequest);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  const needSetCookie =
    !cookieAnon || cookieAnon.length < 10 || anonForThisRequest !== cookieAnon;
  if (needSetCookie) {
    res.cookies.set(ANON_COOKIE, anonForThisRequest, {
      httpOnly: true,
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
      path: "/",
      maxAge: ANON_COOKIE_MAX_AGE,
    });
  }

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

  // Refresh session cookies if needed.
  await supabase.auth.getUser();

  return res;
}

export const config = {
  matcher: [
    /*
     * Run on all routes except:
     * - static files
     * - Next.js internals
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2)$).*)",
  ],
};

