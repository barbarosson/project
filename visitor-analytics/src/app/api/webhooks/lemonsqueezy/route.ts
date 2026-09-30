import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { planFromVariant, PLAN_LIMITS, PlanId } from "@/lib/plans";
import { applyPlanEntitlement } from "@/lib/quota";
import { prisma } from "@/lib/prisma";

/**
 * Lemon Squeezy webhook.
 * - With LEMONSQUEEZY_WEBHOOK_SECRET: verifies X-Signature (HMAC-SHA256 hex).
 * - Without secret: accepts only when header X-SitePulse-Stub: 1 (local/dev).
 * Entitlement mapping: meta.custom_data.org_id + variant_id → plan + pageviewLimit.
 *
 * Subscribe in LS to at least: subscription_created, subscription_updated,
 * subscription_cancelled, subscription_expired, subscription_payment_failed,
 * order_created.
 */
function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signature) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(digest);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");
  const stubHeader = req.headers.get("x-sitepulse-stub");
  const hasSecret = Boolean(process.env.LEMONSQUEEZY_WEBHOOK_SECRET);

  if (hasSecret) {
    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else if (stubHeader !== "1") {
    return NextResponse.json(
      {
        error:
          "Webhook stub mode: set LEMONSQUEEZY_WEBHOOK_SECRET or send X-SitePulse-Stub: 1 for local tests",
      },
      { status: 401 }
    );
  }

  let payload: {
    meta?: {
      event_name?: string;
      custom_data?: { org_id?: string; plan?: string };
    };
    data?: {
      id?: string;
      attributes?: {
        customer_id?: number | string;
        variant_id?: number | string;
        status?: string;
        first_subscription_item?: { variant_id?: number | string };
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name || "unknown";
  const orgId = payload.meta?.custom_data?.org_id;
  const customPlan = payload.meta?.custom_data?.plan as PlanId | undefined;
  const variantId =
    payload.data?.attributes?.variant_id ||
    payload.data?.attributes?.first_subscription_item?.variant_id;
  const customerId = payload.data?.attributes?.customer_id;
  const subscriptionId = payload.data?.id;
  const status = payload.data?.attributes?.status;

  if (!orgId) {
    // Acknowledge but no-op (LS may send events without our custom data)
    return NextResponse.json({
      ok: true,
      applied: false,
      reason: "no_org_id",
      eventName,
    });
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    return NextResponse.json({
      ok: true,
      applied: false,
      reason: "org_not_found",
      eventName,
    });
  }

  let plan: PlanId | null =
    customPlan && customPlan in PLAN_LIMITS ? customPlan : null;
  if (!plan && variantId != null) {
    plan = planFromVariant(variantId);
  }

  const cancelEvents = [
    "subscription_cancelled",
    "subscription_expired",
    "subscription_payment_failed",
  ];
  if (cancelEvents.includes(eventName)) {
    await applyPlanEntitlement(orgId, "dev", {
      billingStatus: status === "past_due" ? "past_due" : "cancelled",
      lsCustomerId: customerId != null ? String(customerId) : undefined,
      lsSubscriptionId: subscriptionId ? String(subscriptionId) : undefined,
    });
    return NextResponse.json({
      ok: true,
      applied: true,
      plan: "dev",
      eventName,
    });
  }

  if (
    plan &&
    (eventName.includes("subscription") ||
      eventName === "order_created" ||
      eventName.startsWith("stub_"))
  ) {
    await applyPlanEntitlement(orgId, plan, {
      billingStatus: "active",
      lsCustomerId: customerId != null ? String(customerId) : undefined,
      lsSubscriptionId: subscriptionId ? String(subscriptionId) : undefined,
    });
    return NextResponse.json({
      ok: true,
      applied: true,
      plan,
      pageviewLimit: PLAN_LIMITS[plan].pageviews,
      eventName,
    });
  }

  return NextResponse.json({
    ok: true,
    applied: false,
    reason: "unhandled_event",
    eventName,
  });
}
