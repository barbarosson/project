import type { User } from "@supabase/supabase-js";

import { REFERRAL_BONUS_CREDITS_WHOLE } from "@/lib/referrals/constants";
import {
  buildInviteUrl,
  ensureReferralProfileForUser,
  getReferralDashboardStats,
} from "@/lib/referrals/referral-service";
import { tenthsToDisplayCredits } from "@/lib/credits-units";
import { baseSiteUrl } from "@/lib/site-metadata";

export type RewardsPayload = {
  referral_code: string;
  invite_url: string;
  friends_invited: number;
  credits_earned: number;
  bonus_per_friend: number;
};

export async function loadRewardsPayloadForUser(user: User): Promise<RewardsPayload | null> {
  const profile = await ensureReferralProfileForUser(user);
  if (!profile) return null;

  const stats = await getReferralDashboardStats(user.id);
  if (!stats) return null;

  return {
    referral_code: stats.referralCode,
    invite_url: buildInviteUrl(baseSiteUrl().origin, stats.referralCode),
    friends_invited: stats.friendsInvited,
    credits_earned: tenthsToDisplayCredits(stats.creditsEarnedTenths),
    bonus_per_friend: REFERRAL_BONUS_CREDITS_WHOLE,
  };
}
