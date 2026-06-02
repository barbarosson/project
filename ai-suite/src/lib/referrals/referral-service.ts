import type { User } from "@supabase/supabase-js";

import { generateReferralCode, normalizeReferralCode } from "@/lib/referrals/code";
import {
  REFERRAL_BONUS_CREDITS_TENTHS,
  REFERRAL_CODE_LENGTH,
} from "@/lib/referrals/constants";
import {
  directAllocateReferralCode,
  directGetReferralDashboardStats,
  directGetReferralProfile,
  directInsertReferralProfile,
  directReferrerExists,
  directUpsertReferralAttribution,
  getReferralDirectSql,
  type ReferralProfileRow,
} from "@/lib/referrals/referral-db";
import {
  deviceFingerprintFromRequest,
  referralIpFromRequest,
} from "@/lib/referrals/request-ip";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";
import { tenthsToDisplayCredits } from "@/lib/credits-units";

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

function isSchemaExposureError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("invalid schema") || m.includes("does not exist") || m.includes("schema cache");
}

async function allocateUniqueCodePostgrest(
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

async function ensureReferralProfilePostgrest(
  user: User,
  opts?: { referredByCode?: string | null }
): Promise<ReferralProfileRow | null> {
  const admin = createSupabaseAdminClientOrNull();
  if (!admin) return null;

  const userId = user.id.trim();
  if (!userId) return null;

  const { data: existing, error: readErr } = await admin
    .schema("isendai")
    .from("referral_profiles")
    .select("user_id, referral_code, referred_by_code, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (readErr && isSchemaExposureError(readErr.message)) {
    return null;
  }

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

  const referralCode = await allocateUniqueCodePostgrest(admin);

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
    console.warn("[referrals] PostgREST profile insert failed:", error?.message);
    return null;
  }

  return inserted as ReferralProfileRow;
}

async function ensureReferralProfileDirect(
  user: User,
  opts?: { referredByCode?: string | null }
): Promise<ReferralProfileRow | null> {
  const userId = user.id.trim();
  if (!userId) return null;

  const existing = await directGetReferralProfile(userId);
  if (existing) return existing;

  const referredBy =
    normalizeReferralCode(opts?.referredByCode ?? undefined) ??
    referredByFromUser(user);

  let safeReferredBy: string | null = referredBy;
  if (safeReferredBy && !(await directReferrerExists(safeReferredBy))) {
    safeReferredBy = null;
  }

  const referralCode = await directAllocateReferralCode();
  return directInsertReferralProfile(userId, referralCode, safeReferredBy);
}

export async function ensureReferralProfileForUser(
  user: User,
  opts?: { referredByCode?: string | null }
): Promise<ReferralProfileRow | null> {
  const userId = user.id.trim();
  if (!userId) return null;

  if (getReferralDirectSql()) {
    try {
      const profile = await ensureReferralProfileDirect(user, opts);
      if (profile) {
        await syncReferralCodeToUserMetadata(user, profile.referral_code, profile.referred_by_code);
        return profile;
      }
    } catch (e) {
      console.warn("[referrals] direct SQL profile failed:", e);
    }
  }

  const profile = await ensureReferralProfilePostgrest(user, opts);
  if (profile) {
    await syncReferralCodeToUserMetadata(user, profile.referral_code, profile.referred_by_code);
  }
  return profile;
}

async function syncReferralCodeToUserMetadata(
  user: User,
  referralCode: string,
  referredBy: string | null
): Promise<void> {
  const admin = createSupabaseAdminClientOrNull();
  if (!admin) return;
  try {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...((user.user_metadata as Record<string, unknown>) ?? {}),
        referral_code: referralCode,
        ...(referredBy ? { referred_by: referredBy } : {}),
      },
    });
  } catch {
    // non-fatal
  }
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
  const profile = await ensureReferralProfileForUser(user, opts);
  if (!profile?.referred_by_code) {
    return { logged: false, reason: "no_referrer" };
  }

  const ip = referralIpFromRequest(req);
  if (!ip || ip === "local") {
    return { logged: false, reason: "ip_unavailable" };
  }

  const payload = {
    userId: user.id,
    referredByCode: profile.referred_by_code,
    ipAddress: ip,
    deviceFingerprint: deviceFingerprintFromRequest(req),
  };

  if (getReferralDirectSql()) {
    try {
      const ok = await directUpsertReferralAttribution(payload);
      if (ok) return { logged: true };
    } catch (e) {
      console.warn("[referrals] direct attribution failed:", e);
    }
  }

  const admin = createSupabaseAdminClientOrNull();
  if (!admin) {
    return { logged: false, reason: "admin_unavailable" };
  }

  const { error } = await admin.schema("isendai").from("referral_signup_attribution").upsert(
    {
      user_id: user.id,
      referred_by_code: profile.referred_by_code,
      ip_address: ip,
      device_fingerprint: payload.deviceFingerprint,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.warn("[referrals] attribution upsert failed:", error.message);
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
  if (!admin && !getReferralDirectSql()) {
    return { status: "error", message: "Referral backend not configured" };
  }

  const profile = await ensureReferralProfileForUser(user);
  if (!profile?.referred_by_code) {
    return { status: "not_eligible", reason: "no_referrer" };
  }

  if (!admin) {
    return { status: "pending_processing" };
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

export type EnsureReferralProfileResult =
  | { ok: true; profile: ReferralProfileRow }
  | { ok: false; code: "no_admin" | "profile_failed" | "invalid_user" };

export async function ensureReferralProfileWithDiagnostics(
  user: User,
  opts?: { referredByCode?: string | null }
): Promise<EnsureReferralProfileResult> {
  if (!user.id.trim()) {
    return { ok: false, code: "invalid_user" };
  }
  if (!createSupabaseAdminClientOrNull() && !getReferralDirectSql()) {
    return { ok: false, code: "no_admin" };
  }
  const profile = await ensureReferralProfileForUser(user, opts);
  if (!profile) {
    return { ok: false, code: "profile_failed" };
  }
  return { ok: true, profile };
}

export async function getReferralDashboardStats(userId: string): Promise<{
  referralCode: string;
  friendsInvited: number;
  creditsEarnedTenths: number;
} | null> {
  if (getReferralDirectSql()) {
    try {
      const stats = await directGetReferralDashboardStats(userId);
      if (stats) return stats;
    } catch (e) {
      console.warn("[referrals] direct stats failed:", e);
    }
  }

  const admin = createSupabaseAdminClientOrNull();
  if (!admin) return null;

  const { data: profile, error: profileErr } = await admin
    .schema("isendai")
    .from("referral_profiles")
    .select("referral_code")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileErr) {
    console.warn("[referrals] stats profile read failed:", profileErr.message);
    return null;
  }

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
