import { NextResponse } from "next/server";

import { ensureUserEntitlementsBootstrap } from "@/lib/isendai/ensure-user-entitlements";
import {
  ensureReferralProfileForUser,
  logReferralSignupAttribution,
} from "@/lib/referrals/referral-service";
import { parseReferralCookie } from "@/lib/referrals/ref-cookie";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** After client-side signInWithIdToken (Google GIS), run the same server work as `/auth/callback`. */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    return NextResponse.json({ error: "Sign in required.", code: "auth_required" }, { status: 401 });
  }

  await ensureUserEntitlementsBootstrap(user.id);

  const referredFromCookie = parseReferralCookie(req.headers.get("cookie"));
  await ensureReferralProfileForUser(user, { referredByCode: referredFromCookie });
  await logReferralSignupAttribution(user, req, { referredByCode: referredFromCookie });

  return NextResponse.json({ ok: true });
}
