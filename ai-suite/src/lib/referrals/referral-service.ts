import type { User } from "@supabase/supabase-js";

import { generateReferralCode, normalizeReferralCode } from "@/lib/referrals/code";
import {
  REFERRAL_BONUS_CREDITS_TENTHS,
  REFERRAL_CODE_LENGTH,
} from "@/lib/referrals/constants";
import {
  deviceFingerprintFromRequest,
  referralIpFromRequest,
} from "@/lib/referrals/request-ip";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";
import { tenthsToDisplayCredits } from "@/lib/credits-units";

type ReferralProfileRow = {
  user_id: string;
  referral_code: string;
  referred_by_code: string | null;
  created_at: string;
};

type ReferralGrantRow = {
  status: string;
  block_reason: string | null;
  credits_tenths_each: number;
};

function referredByFromUser(user: User): string | null {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const raw =
    (typeof meta?.referred_by === "string" ? meta.referred_by : null) ??
    (typeof meta?.referral_code_invited_by === "string" ? meta.referral_code_invited_by : null);
  return normalizeReferralCode(raw);
}

/** Credits are granted by Postgres after `email_confirmed_at` is set — never on signUp alone. */
export function isUserEmailVerified(user: User): boolean {
  return Boolean(user.email_confirmed_at);
}

async function allocateUniqueCode(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClientOrNull>>
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = generateReferralCode(REFERRAL_CODE_LENGTH);
    const { data } = await admin
      .schema("isendai")
      .from("referral_profiles")
      .select("user_id")
      .eq("referral_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not allocate referral code");
}

export async function ensureReferralProfileForUser(
  user: User,
  opts?: { referredByCode?: string | null }
): Promise<ReferralProfileRow | null> {
  const admin = createSupabaseAdminClientOrNull();
  if (!admin) return null;

  const userId = user.id.trim();
  if (!userId) return null;

  const { data: existing } = await admin
    .schema("isendai")
    .from("referral_profiles")
    .select("user_id, referral_code, referred_by_code, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return existing as ReferralProfileRow;
  }

  const referredBy =
    normalizeReferralCode(opts?.referredByCode ?? undefined) ??
    referredByFromUser(user);

  let safeReferredBy: string | null = referredBy;
  if (safeReferredBy) {
    const { data: referrerRow } = await admin
      .schema("isendai")
      .from("referral_profiles")
      .select("user_id")
      .eq("referral_code", safeReferredBy)
      .maybeSingle();
    if (!referrerRow) {
      safeReferredBy = null;
    }
  }

  const referralCode = await allocateUniqueCode(admin);

  const { data: inserted, error } = await admin
    .schema("isendai")
    .from("referral_profiles")
    .insert({
      user_id: userId,
      referral_code: referralCode,
      referred_by_code: safeReferredBy,
    })
    .select("user_id, referral_code, referred_by_code, created_at")
    .single();

  if (error || !inserted) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[referrals] profile insert failed:", error?.message);
    }
    return null;
  }

  try {
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...((user.user_metadata as Record<string, unknown>) ?? {}),
        referral_code: referralCode,
        ...(safeReferredBy ? { referred_by: safeReferredBy } : {}),
      },
    });
  } catch {
    // non-fatal
  }

  return inserted as ReferralProfileRow;
}

/**
 * Records signup IP/fingerprint for anti-fraud. Credits live in `isendai.entitlements`
 * (`credits_balance`, tenths) and are incremented only by Postgres
 * `isendai.process_referral_rewards_for_user` after `email_confirmed_at` is set.
 */
export async function logReferralSignupAttribution(
  user: User,
  req: Request,
  opts?: { referredByCode?: string | null }
): Promise<{ logged: boolean; reason?: string }> {
  const admin = createSupabaseAdminClientOrNull();
  if (!admin) {
    return { logged: false, reason: "admin_unavailable" };
  }

  const profile = await ensureReferralProfileForUser(user, opts);
  if (!profile?.referred_by_code) {
    return { logged: false, reason: "no_referrer" };
  }

  const ip = referralIpFromRequest(req);
  if (!ip || ip === "local") {
    return { logged: false, reason: "ip_unavailable" };
  }

  const { error } = await admin.schema("isendai").from("referral_signup_attribution").upsert(
    {
      user_id: user.id,
      referred_by_code: profile.referred_by_code,
      ip_address: ip,
      device_fingerprint: deviceFingerprintFromRequest(req),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[referrals] attribution upsert failed:", error.message);
    }
    return { logged: false, reason: "upsert_failed" };
  }

  return { logged: true };
}

export type ReferralRewardStatus =
  | { status: "granted"; creditsEach: number }
  | { status: "pending_email_verification" }
  | { status: "pending_attribution" }
  | { status: "pending_processing" }
  | { status: "blocked"; reason: string }
  | { status: "not_eligible"; reason: string }
  | { status: "error"; message: string };

export async function getReferralRewardStatusForUser(user: User): Promise<ReferralRewardStatus> {
  const admin = createSupabaseAdminClientOrNull();
  if (!admin) {
    return { status: "error", message: "Billing not configured" };
  }

  const profile = await ensureReferralProfileForUser(user);
  if (!profile?.referred_by_code) {
    return { status: "not_eligible", reason: "no_referrer" };
  }

  const { data: grant } = await admin
    .schema("isendai")
    .from("referral_reward_grants")
    .select("status, block_reason, credits_tenths_each")
    .eq("referee_user_id", user.id)
    .maybeSingle();

  const row = grant as ReferralGrantRow | null;

  if (row?.status === "granted") {
    return {
      status: "granted",
      creditsEach: tenthsToDisplayCredits(row.credits_tenths_each ?? REFERRAL_BONUS_CREDITS_TENTHS),
    };
  }

  if (row?.status?.startsWith("blocked")) {
    return { status: "blocked", reason: row.block_reason ?? row.status };
  }

  if (!isUserEmailVerified(user)) {
    return { status: "pending_email_verification" };
  }

  const { data: attribution } = await admin
    .schema("isendai")
    .from("referral_signup_attribution")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!attribution) {
    return { status: "pending_attribution" };
  }

  return { status: "pending_processing" };
}

export async function getReferralDashboardStats(userId: string): Promise<{
  referralCode: string;
  friendsInvited: number;
  creditsEarnedTenths: number;
} | null> {
  const admin = createSupabaseAdminClientOrNull();
  if (!admin) return null;

  const { data: profile } = await admin
    .schema("isendai")
    .from("referral_profiles")
    .select("referral_code")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile?.referral_code) return null;

  const { count: friendsInvited } = await admin
    .schema("isendai")
    .from("referral_profiles")
    .select("user_id", { count: "exact", head: true })
    .eq("referred_by_code", profile.referral_code);

  const { data: grants } = await admin
    .schema("isendai")
    .from("referral_reward_grants")
    .select("credits_tenths_each")
    .eq("referrer_user_id", userId)
    .eq("status", "granted");

  const creditsEarnedTenths = (grants ?? []).reduce(
    (sum, row) => sum + Number(row.credits_tenths_each ?? 0),
    0
  );

  return {
    referralCode: profile.referral_code,
    friendsInvited: friendsInvited ?? 0,
    creditsEarnedTenths,
  };
}

export function buildInviteUrl(siteOrigin: string, referralCode: string): string {
  const base = siteOrigin.replace(/\/$/, "");
  return `${base}/join?ref=${encodeURIComponent(referralCode)}`;
}
