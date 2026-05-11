import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { requiredEnv } from "@/lib/env";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

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
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

