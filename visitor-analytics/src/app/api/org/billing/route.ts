import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  canManageTeam,
  getSessionFromRequest,
  getUserOrg,
} from "@/lib/auth";
import {
  createLemonCheckout,
  isBillingConfigured,
  isPlanId,
  PLAN_LIMITS,
  PlanId,
} from "@/lib/plans";
import { getOrgQuota } from "@/lib/quota";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getUserOrg(session.id);
  if (!membership) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const quota = await getOrgQuota(membership.orgId);
  return NextResponse.json({
    billingConfigured: isBillingConfigured(),
    role: membership.role,
    canManage: canManageTeam(membership.role),
    org: {
      id: membership.org.id,
      name: membership.org.name,
      lsCustomerId: membership.org.lsCustomerId,
      lsSubscriptionId: membership.org.lsSubscriptionId,
    },
    quota,
    plans: Object.entries(PLAN_LIMITS).map(([id, p]) => ({
      id,
      label: p.label,
      pageviews: p.pageviews,
      priceUsd: p.priceUsd,
    })),
  });
}

const checkoutSchema = z.object({
  plan: z.enum(["starter", "agency", "scale"]),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getUserOrg(session.id);
  if (!membership || !canManageTeam(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = checkoutSchema.parse(await req.json());
    const plan = body.plan as PlanId;
    if (!isPlanId(plan) || plan === "dev") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const result = await createLemonCheckout({
      plan,
      orgId: membership.orgId,
      email: session.email,
    });

    if ("stub" in result) {
      return NextResponse.json({
        stub: true,
        reason: result.reason,
        message:
          "MoR checkout is stubbed until Lemon Squeezy env vars are set. See README.",
        plan,
        planLabel: PLAN_LIMITS[plan].label,
      });
    }

    return NextResponse.json({ url: result.url, stub: false });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
