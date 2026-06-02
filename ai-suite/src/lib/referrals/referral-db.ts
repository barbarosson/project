import postgres from "postgres";

import { generateReferralCode } from "@/lib/referrals/code";
import { REFERRAL_CODE_LENGTH } from "@/lib/referrals/constants";

export type ReferralProfileRow = {
  user_id: string;
  referral_code: string;
  referred_by_code: string | null;
  created_at: string;
};

let directSql: ReturnType<typeof postgres> | null = null;

export function getReferralDirectSql(): ReturnType<typeof postgres> | null {
  const url =
    process.env.SUPABASE_DATABASE_URL?.trim() ||
    process.env.DIRECT_POSTGRES_URL?.trim();
  if (!url) return null;
  if (!directSql) {
    directSql = postgres(url, {
      ssl: "require",
      max: 4,
      idle_timeout: 30,
      connect_timeout: 12,
      prepare: false,
    });
  }
  return directSql;
}

export async function directGetReferralProfile(
  userId: string
): Promise<ReferralProfileRow | null> {
  const sql = getReferralDirectSql();
  if (!sql) return null;

  const rows = await sql<ReferralProfileRow[]>`
    SELECT user_id, referral_code, referred_by_code, created_at::text AS created_at
    FROM isendai.referral_profiles
    WHERE user_id = ${userId}::uuid
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function directReferralCodeTaken(code: string): Promise<boolean> {
  const sql = getReferralDirectSql();
  if (!sql) return true;

  const rows = await sql<{ user_id: string }[]>`
    SELECT user_id FROM isendai.referral_profiles WHERE referral_code = ${code} LIMIT 1
  `;
  return rows.length > 0;
}

export async function directReferrerExists(code: string): Promise<boolean> {
  const sql = getReferralDirectSql();
  if (!sql) return false;

  const rows = await sql<{ user_id: string }[]>`
    SELECT user_id FROM isendai.referral_profiles WHERE referral_code = ${code} LIMIT 1
  `;
  return rows.length > 0;
}

export async function directAllocateReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = generateReferralCode(REFERRAL_CODE_LENGTH);
    if (!(await directReferralCodeTaken(code))) return code;
  }
  throw new Error("Could not allocate referral code");
}

export async function directInsertReferralProfile(
  userId: string,
  referralCode: string,
  referredByCode: string | null
): Promise<ReferralProfileRow | null> {
  const sql = getReferralDirectSql();
  if (!sql) return null;

  const rows = await sql<ReferralProfileRow[]>`
    INSERT INTO isendai.referral_profiles (user_id, referral_code, referred_by_code)
    VALUES (${userId}::uuid, ${referralCode}, ${referredByCode})
    ON CONFLICT (user_id) DO NOTHING
    RETURNING user_id, referral_code, referred_by_code, created_at::text AS created_at
  `;
  if (rows[0]) return rows[0];
  return directGetReferralProfile(userId);
}

export async function directGetReferralDashboardStats(userId: string): Promise<{
  referralCode: string;
  friendsInvited: number;
  creditsEarnedTenths: number;
} | null> {
  const sql = getReferralDirectSql();
  if (!sql) return null;

  const profileRows = await sql<{ referral_code: string }[]>`
    SELECT referral_code FROM isendai.referral_profiles WHERE user_id = ${userId}::uuid LIMIT 1
  `;
  const referralCode = profileRows[0]?.referral_code;
  if (!referralCode) return null;

  const countRows = await sql<{ count: string }[]>`
    SELECT count(*)::text AS count
    FROM isendai.referral_profiles
    WHERE referred_by_code = ${referralCode}
  `;

  const grantRows = await sql<{ sum: string | null }[]>`
    SELECT coalesce(sum(credits_tenths_each), 0)::text AS sum
    FROM isendai.referral_reward_grants
    WHERE referrer_user_id = ${userId}::uuid
      AND status = 'granted'
  `;

  return {
    referralCode,
    friendsInvited: Number(countRows[0]?.count ?? 0),
    creditsEarnedTenths: Number(grantRows[0]?.sum ?? 0),
  };
}

export async function directUpsertReferralAttribution(params: {
  userId: string;
  referredByCode: string;
  ipAddress: string;
  deviceFingerprint: string | null;
}): Promise<boolean> {
  const sql = getReferralDirectSql();
  if (!sql) return false;

  await sql`
    INSERT INTO isendai.referral_signup_attribution (
      user_id, referred_by_code, ip_address, device_fingerprint
    )
    VALUES (
      ${params.userId}::uuid,
      ${params.referredByCode},
      ${params.ipAddress},
      ${params.deviceFingerprint}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      referred_by_code = EXCLUDED.referred_by_code,
      ip_address = EXCLUDED.ip_address,
      device_fingerprint = EXCLUDED.device_fingerprint
  `;
  return true;
}
