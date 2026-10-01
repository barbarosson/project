import { prisma } from "./prisma";
import {
  currentQuotaMonth,
  isHardOverQuota,
  isSoftWarning,
  PLAN_LIMITS,
  PlanId,
  isPlanId,
  quotaUsagePct,
} from "./plans";

export type QuotaSnapshot = {
  plan: PlanId;
  planLabel: string;
  pageviewsUsed: number;
  pageviewLimit: number;
  quotaMonth: string;
  softWarningPct: number;
  usagePct: number;
  softWarning: boolean;
  hardExceeded: boolean;
  billingStatus: string;
};

/** Ensure org quota window is current month; sync limit from plan. */
export async function ensureQuotaWindow(orgId: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return null;

  const month = currentQuotaMonth();
  const plan: PlanId = isPlanId(org.plan) ? org.plan : "dev";
  const limit = PLAN_LIMITS[plan].pageviews;

  if (org.quotaMonth !== month || org.pageviewLimit !== limit) {
    return prisma.organization.update({
      where: { id: orgId },
      data: {
        quotaMonth: month,
        pageviewLimit: limit,
        pageviewsUsed: org.quotaMonth === month ? org.pageviewsUsed : 0,
        plan,
      },
    });
  }
  return org;
}

export function snapshotFromOrg(org: {
  plan: string;
  pageviewsUsed: number;
  pageviewLimit: number;
  quotaMonth: string;
  softWarningPct: number;
  billingStatus: string;
}): QuotaSnapshot {
  const plan: PlanId = isPlanId(org.plan) ? org.plan : "dev";
  const limit = org.pageviewLimit || PLAN_LIMITS[plan].pageviews;
  return {
    plan,
    planLabel: PLAN_LIMITS[plan].label,
    pageviewsUsed: org.pageviewsUsed,
    pageviewLimit: limit,
    quotaMonth: org.quotaMonth || currentQuotaMonth(),
    softWarningPct: org.softWarningPct,
    usagePct: quotaUsagePct(org.pageviewsUsed, limit),
    softWarning: isSoftWarning(
      org.pageviewsUsed,
      limit,
      org.softWarningPct
    ),
    hardExceeded: isHardOverQuota(org.pageviewsUsed, limit),
    billingStatus: org.billingStatus,
  };
}

export async function getOrgQuota(orgId: string): Promise<QuotaSnapshot | null> {
  const org = await ensureQuotaWindow(orgId);
  if (!org) return null;
  return snapshotFromOrg(org);
}

/**
 * Check + increment pageview quota for an org.
 * Returns { allowed, org, snapshot }. Rejects when hard over.
 */
export async function consumePageviewQuota(orgId: string) {
  const org = await ensureQuotaWindow(orgId);
  if (!org) {
    return { allowed: false as const, reason: "org_not_found" as const };
  }

  const snap = snapshotFromOrg(org);
  if (snap.hardExceeded) {
    return { allowed: false as const, reason: "quota_exceeded" as const, snapshot: snap, org };
  }

  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: { pageviewsUsed: { increment: 1 } },
  });

  const snapshot = snapshotFromOrg(updated);
  // Fire-and-forget in-app (+ optional email) when crossing soft/hard thresholds
  if (snapshot.softWarning || snapshot.hardExceeded) {
    void import("./digest")
      .then((m) => m.maybeNotifyQuota(orgId))
      .catch(() => undefined);
  }

  return {
    allowed: true as const,
    org: updated,
    snapshot,
  };
}

export async function applyPlanEntitlement(
  orgId: string,
  plan: PlanId,
  opts?: {
    lsCustomerId?: string | null;
    lsSubscriptionId?: string | null;
    billingStatus?: string;
  }
) {
  const limit = PLAN_LIMITS[plan].pageviews;
  return prisma.organization.update({
    where: { id: orgId },
    data: {
      plan,
      pageviewLimit: limit,
      billingStatus: opts?.billingStatus ?? "active",
      lsCustomerId: opts?.lsCustomerId ?? undefined,
      lsSubscriptionId: opts?.lsSubscriptionId ?? undefined,
    },
  });
}
