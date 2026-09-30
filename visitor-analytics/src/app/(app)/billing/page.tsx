import { redirect } from "next/navigation";
import {
  canManageTeam,
  getSession,
  getUserOrg,
} from "@/lib/auth";
import { isBillingConfigured, PLAN_LIMITS } from "@/lib/plans";
import { getOrgQuota } from "@/lib/quota";
import { BillingPanel } from "@/components/billing-panel";
import { BackLink } from "@/components/page-nav";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await getUserOrg(session.id);
  if (!membership) redirect("/dashboard");

  const quota = await getOrgQuota(membership.orgId);
  if (!quota) redirect("/dashboard");

  const { plan: highlightPlan } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/dashboard" label="Portfolio" />
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Billing & quota
        </h1>
        <p className="text-[var(--muted)]">
          Merchant of Record: Lemon Squeezy (subscription). No AppSumo LTD.
        </p>
        {highlightPlan && (
          <p className="mt-2 rounded-lg border border-[var(--line)] bg-white/70 px-3 py-2 text-sm text-[var(--muted)]">
            You selected the{" "}
            <strong className="text-[var(--ink)]">{highlightPlan}</strong> plan
            during signup. Use checkout below when Lemon Squeezy is configured.
          </p>
        )}
      </div>
      <BillingPanel
        billingConfigured={isBillingConfigured()}
        canManage={canManageTeam(membership.role)}
        highlightPlan={highlightPlan}
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
