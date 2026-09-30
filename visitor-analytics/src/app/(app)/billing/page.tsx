import { redirect } from "next/navigation";
import {
  canManageTeam,
  getSession,
  getUserOrg,
} from "@/lib/auth";
import { isBillingConfigured, PLAN_LIMITS } from "@/lib/plans";
import { getOrgQuota } from "@/lib/quota";
import { BillingPanel } from "@/components/billing-panel";

export default async function BillingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await getUserOrg(session.id);
  if (!membership) redirect("/dashboard");

  const quota = await getOrgQuota(membership.orgId);
  if (!quota) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Billing & quota
        </h1>
        <p className="text-[var(--muted)]">
          Merchant of Record: Lemon Squeezy (subscription). No AppSumo LTD.
        </p>
      </div>
      <BillingPanel
        billingConfigured={isBillingConfigured()}
        canManage={canManageTeam(membership.role)}
        quota={quota}
        plans={Object.entries(PLAN_LIMITS).map(([id, p]) => ({
          id,
          label: p.label,
          pageviews: p.pageviews,
          priceUsd: p.priceUsd,
        }))}
      />
    </div>
  );
}
