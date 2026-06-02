import { NextResponse } from "next/server";

import {
  ensureReferralProfileForUser,
  getReferralRewardStatusForUser,
  logReferralSignupAttribution,
} from "@/lib/referrals/referral-service";
import { parseReferralCookie } from "@/lib/referrals/ref-cookie";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Log signup IP/fingerprint; credits are granted by Postgres after email verification. */
export async function POST(req: Request) {
  const rl = await enforceRateLimit(req, "referral-attribution", 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests.", code: "rate_limited" },
      { status: 429, headers: { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    return NextResponse.json({ error: "Sign in required.", code: "auth_required" }, { status: 401 });
  }

  const referredFromCookie = parseReferralCookie(req.headers.get("cookie"));
  const attribution = await logReferralSignupAttribution(user, req, {
    referredByCode: referredFromCookie,
  });
  const rewardStatus = await getReferralRewardStatusForUser(user);

  return NextResponse.json({
    attribution,
    reward: rewardStatus,
  });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    return NextResponse.json({ error: "Sign in required.", code: "auth_required" }, { status: 401 });
  }

  await ensureReferralProfileForUser(user);
  const rewardStatus = await getReferralRewardStatusForUser(user);
  return NextResponse.json({ reward: rewardStatus });
}
