import { NextResponse } from "next/server";

import {
  buildInviteUrl,
  ensureReferralProfileForUser,
  getReferralDashboardStats,
  getReferralRewardStatusForUser,
  logReferralSignupAttribution,
} from "@/lib/referrals/referral-service";
import { parseReferralCookie } from "@/lib/referrals/ref-cookie";
import { REFERRAL_BONUS_CREDITS_WHOLE } from "@/lib/referrals/constants";
import { baseSiteUrl } from "@/lib/site-metadata";
import { tenthsToDisplayCredits } from "@/lib/credits-units";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    return NextResponse.json({ error: "Sign in required.", code: "auth_required" }, { status: 401 });
  }

  await ensureReferralProfileForUser(user);

  const stats = await getReferralDashboardStats(user.id);
  if (!stats) {
    return NextResponse.json(
      { error: "Referral profile unavailable.", code: "unavailable" },
      { status: 503 }
    );
  }

  const rewardStatus = await getReferralRewardStatusForUser(user);
  const origin = baseSiteUrl().origin;
  return NextResponse.json({
    referral_code: stats.referralCode,
    invite_url: buildInviteUrl(origin, stats.referralCode),
    friends_invited: stats.friendsInvited,
    credits_earned: tenthsToDisplayCredits(stats.creditsEarnedTenths),
    bonus_per_friend: REFERRAL_BONUS_CREDITS_WHOLE,
    reward_status: rewardStatus.status,
  });
}

/** Ensures profile + IP attribution; credits are applied by Supabase triggers after email verify. */
export async function POST(req: Request) {
  const rl = await enforceRateLimit(req, "referral-reward", 10, 60_000);
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
  await logReferralSignupAttribution(user, req, { referredByCode: referredFromCookie });
  const rewardStatus = await getReferralRewardStatusForUser(user);

  return NextResponse.json({
    reward: rewardStatus,
    bonus_credits: REFERRAL_BONUS_CREDITS_WHOLE,
  });
}
