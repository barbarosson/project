import { NextResponse } from "next/server";

import {
  ensureReferralProfileWithDiagnostics,
  getReferralRewardStatusForUser,
  logReferralSignupAttribution,
} from "@/lib/referrals/referral-service";
import { loadRewardsPayloadForUser } from "@/lib/referrals/load-rewards-payload";
import { parseReferralCookie } from "@/lib/referrals/ref-cookie";
import { REFERRAL_BONUS_CREDITS_WHOLE } from "@/lib/referrals/constants";
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

  const ensured = await ensureReferralProfileWithDiagnostics(user);
  if (!ensured.ok) {
    const messages: Record<typeof ensured.code, string> = {
      no_admin:
        "Server missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_DATABASE_URL. Add one in Netlify env vars.",
      profile_failed:
        "Could not create referral profile. In Supabase SQL Editor run supabase/migrations/20260602190000_isendai_referral_public_rpc.sql (or add isendai to Exposed schemas).",
      invalid_user: "Invalid user session.",
    };
    return NextResponse.json(
      { error: messages[ensured.code], code: ensured.code },
      { status: 503 }
    );
  }

  const payload = await loadRewardsPayloadForUser(user);
  if (!payload) {
    return NextResponse.json(
      {
        error: "Referral profile unavailable after create.",
        code: "stats_unavailable",
      },
      { status: 503 }
    );
  }

  const rewardStatus = await getReferralRewardStatusForUser(user);
  return NextResponse.json({
    ...payload,
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
