import crypto from "crypto";
import { NextResponse } from "next/server";

import { isToolName } from "@/components/ai-suite/tools";
import {
  billingAddCredits,
  billingEnsureEntitlement,
  billingSetCreditsBalance,
} from "@/lib/isendai/billing-rpc";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  oneTimeCreditsForVariantId,
  planKeyFromVariantId,
  subscriptionCreditsForVariantId,
  trialCreditsForSubscriptionStart,
} from "@/lib/lemonsqueezy/catalog";
import { trialOwnerFingerprint } from "@/lib/trial/fingerprint";

export const runtime = "nodejs";

function verifyLemonSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(rawBody, "utf8").digest("hex"), "utf8");
  const signature = Buffer.from(signatureHeader, "utf8");
  if (digest.length !== signature.length) return false;
  return crypto.timingSafeEqual(digest, signature);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStr(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return null;
}

function parseVariantId(attrs: Record<string, unknown>): string | null {
  const v =
    attrs.variant_id ??
    attrs.variantId ??
    (attrs.first_subscription_item as Record<string, unknown> | undefined)?.variant_id;
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;
  return null;
}

function extractCustom(root: Record<string, unknown>): {
  owner_type: "user" | "anon" | null;
  owner_id: string | null;
  tool_id: string | null;
} {
  const meta = isRecord(root.meta) ? root.meta : {};
  let custom: Record<string, unknown> = {};
  const cd = meta.custom_data;
  if (isRecord(cd)) custom = cd;

  const ot = custom.owner_type;
  const owner_type = ot === "user" || ot === "anon" ? ot : null;
  const owner_id = typeof custom.owner_id === "string" ? custom.owner_id : null;
  const tool_id = typeof custom.tool_id === "string" ? custom.tool_id : null;
  return { owner_type, owner_id, tool_id };
}

async function tryInsertWebhookEvent(admin: ReturnType<typeof createSupabaseAdminClient>, key: string): Promise<boolean> {
  const { error } = await admin.schema("isendai").from("lemon_webhook_events").insert({ event_key: key });
  if (!error) return true;
  const code = (error as { code?: string }).code;
  if (code === "23505") return false;
  console.error("[webhook] lemon_webhook_events insert:", error);
  return false;
}

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("[webhook] LEMONSQUEEZY_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get("x-signature") ?? request.headers.get("X-Signature");
  if (!verifyLemonSignature(rawBody, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const root = isRecord(parsed) ? parsed : {};
  const meta = isRecord(root.meta) ? root.meta : {};
  const eventName =
    (typeof meta.event_name === "string" ? meta.event_name : null) ??
    request.headers.get("x-event-name") ??
    request.headers.get("X-Event-Name");

  if (!eventName || typeof eventName !== "string") {
    return NextResponse.json({ ok: true });
  }

  const data = isRecord(root.data) ? root.data : {};
  const resourceId = readStr(data, "id") ?? "";
  const dedupeKey = `${eventName}:${resourceId || "no-id"}`;
  const admin = createSupabaseAdminClient();
  const firstSeen = await tryInsertWebhookEvent(admin, dedupeKey);
  if (!firstSeen) {
    return NextResponse.json({ ok: true });
  }

  const attrs = isRecord(data.attributes) ? data.attributes : {};

  // --- subscription_created (trial → 10 credits) ---
  if (eventName === "subscription_created") {
    const { owner_type, owner_id } = extractCustom(root);
    if (!owner_type || !owner_id) {
      console.warn("[webhook] subscription_created missing custom owner.");
      return NextResponse.json({ ok: true });
    }

    const status = typeof attrs.status === "string" ? attrs.status : "";
    const trialEnds =
      typeof attrs.trial_ends_at === "string"
        ? attrs.trial_ends_at
        : typeof attrs.trialEndsAt === "string"
          ? attrs.trialEndsAt
          : null;

    const onTrial = status === "on_trial" || status === "trialing" || trialEnds !== null;

    const variantId = parseVariantId(attrs);
    const allowance = variantId ? subscriptionCreditsForVariantId(variantId) : null;
    const planKey = variantId ? planKeyFromVariantId(variantId) : null;

    const maxVersions = owner_type === "anon" ? 2 : 5;
    const { error: entErr } = await billingEnsureEntitlement(admin, {
      p_owner_type: owner_type,
      p_owner_id: owner_id,
      p_default_credits: 0,
      p_default_max_versions: maxVersions,
    });
    if (entErr) {
      console.error("[webhook] subscription_created ensure entitlement:", entErr);
      await admin.schema("isendai").from("lemon_webhook_events").delete().eq("event_key", dedupeKey);
      return NextResponse.json({ error: "Billing error." }, { status: 500 });
    }

    if (onTrial) {
      const credits = trialCreditsForSubscriptionStart();
      const fp = trialOwnerFingerprint(owner_type, owner_id);
      const { error: fpErr } = await admin.schema("isendai").from("trial_abuse_guard").insert({ fingerprint: fp });
      if (fpErr && (fpErr as { code?: string }).code === "23505") {
        console.warn("[webhook] duplicate trial fingerprint; skipping trial credits.");
        await admin.schema("isendai").from("lemon_webhook_events").delete().eq("event_key", dedupeKey);
        return NextResponse.json({ ok: true });
      }

      const { error: addErr } = await billingAddCredits(admin, {
        p_owner_type: owner_type,
        p_owner_id: owner_id,
        p_amount: credits,
      });
      if (addErr) {
        console.error("[webhook] subscription_created add trial credits:", addErr);
        await admin.schema("isendai").from("trial_abuse_guard").delete().eq("fingerprint", fp);
        await admin.schema("isendai").from("lemon_webhook_events").delete().eq("event_key", dedupeKey);
        return NextResponse.json({ error: "Billing error." }, { status: 500 });
      }

      await admin
        .schema("isendai")
        .from("entitlements")
        .update({
          subscription_status: "trialing",
          trial_ends_at: trialEnds,
          monthly_credit_allowance: allowance ?? null,
          plan_id: planKey,
        })
        .eq("owner_type", owner_type)
        .eq("owner_id", owner_id);
    } else if (allowance !== null) {
      await admin
        .schema("isendai")
        .from("entitlements")
        .update({
          subscription_status: status || "active",
          monthly_credit_allowance: allowance,
          plan_id: planKey,
          trial_ends_at: null,
        })
        .eq("owner_type", owner_type)
        .eq("owner_id", owner_id);
    }

    return NextResponse.json({ ok: true });
  }

  // --- subscription_payment_success → reset credits to tier allowance (no rollover) ---
  if (eventName === "subscription_payment_success") {
    const { owner_type, owner_id } = extractCustom(root);
    if (!owner_type || !owner_id) {
      console.warn("[webhook] subscription_payment_success missing custom owner.");
      return NextResponse.json({ ok: true });
    }

    let variantId = parseVariantId(attrs);
    if (!variantId && isRecord(attrs.subscription)) {
      const subAttrs = attrs.subscription as Record<string, unknown>;
      const nested = isRecord(subAttrs.attributes) ? subAttrs.attributes : subAttrs;
      variantId = parseVariantId(nested as Record<string, unknown>);
    }

    let allowance =
      variantId !== null ? subscriptionCreditsForVariantId(variantId) : null;
    if (allowance === null && owner_type && owner_id) {
      const { data: entRow } = await admin
        .schema("isendai")
        .from("entitlements")
        .select("monthly_credit_allowance")
        .eq("owner_type", owner_type)
        .eq("owner_id", owner_id)
        .maybeSingle();
      const m = entRow?.monthly_credit_allowance;
      if (typeof m === "number" && m > 0) allowance = m;
    }
    if (allowance === null) {
      console.warn("[webhook] subscription_payment_success unknown variant:", variantId);
      return NextResponse.json({ ok: true });
    }

    const maxVersions = owner_type === "anon" ? 2 : 5;
    const { error: entErr } = await billingEnsureEntitlement(admin, {
      p_owner_type: owner_type,
      p_owner_id: owner_id,
      p_default_credits: 0,
      p_default_max_versions: maxVersions,
    });
    if (entErr) {
      console.error("[webhook] subscription_payment_success ensure entitlement:", entErr);
      await admin.schema("isendai").from("lemon_webhook_events").delete().eq("event_key", dedupeKey);
      return NextResponse.json({ error: "Billing error." }, { status: 500 });
    }

    const { error: setErr } = await billingSetCreditsBalance(admin, {
      p_owner_type: owner_type,
      p_owner_id: owner_id,
      p_balance: allowance,
    });
    if (setErr) {
      console.error("[webhook] set credits:", setErr);
      await admin.schema("isendai").from("lemon_webhook_events").delete().eq("event_key", dedupeKey);
      return NextResponse.json({ error: "Billing error." }, { status: 500 });
    }

    const pk = variantId ? planKeyFromVariantId(variantId) : null;
    await admin
      .schema("isendai")
      .from("entitlements")
      .update({
        subscription_status: "active",
        trial_ends_at: null,
        monthly_credit_allowance: allowance,
        plan_id: pk,
      })
      .eq("owner_type", owner_type)
      .eq("owner_id", owner_id);

    return NextResponse.json({ ok: true });
  }

  // --- order_created (one-time packs / legacy tool checkout) ---
  if (eventName === "order_created") {
    const refunded = attrs.refunded === true;
    const status = typeof attrs.status === "string" ? attrs.status : "";
    if (status !== "paid" || refunded) {
      return NextResponse.json({ ok: true });
    }

    const orderIdentifier =
      readStr(attrs, "identifier") ??
      readStr(attrs, "order_number") ??
      (resourceId.length > 0 ? resourceId : null);
    if (!orderIdentifier) {
      console.warn("[webhook] order_created missing identifier.");
      return NextResponse.json({ ok: true });
    }

    const variantId = parseVariantId(attrs);

    const custom = extractCustom(root);
    const owner_type = custom.owner_type;
    const owner_id = custom.owner_id;
    let tool_id = custom.tool_id;

    if (!owner_type || !owner_id) {
      console.warn("[webhook] order_created missing owner mapping.");
      return NextResponse.json({ ok: true });
    }

    if (!tool_id || !isToolName(tool_id)) {
      tool_id = "corporate-whisperer";
    }

    let credits =
      variantId !== null ? oneTimeCreditsForVariantId(variantId) : null;
    if (credits === null) {
      const raw = process.env.LEMON_SQUEEZY_CREDITS_PER_ORDER?.trim();
      const n = raw ? Number.parseInt(raw, 10) : 10;
      credits = Number.isFinite(n) && n > 0 ? n : 10;
    }

    const row = {
      order_identifier: orderIdentifier,
      owner_type,
      owner_id,
      tool_id,
      credits_granted: credits,
    };

    const { error: insErr } = await admin.schema("isendai").from("lemon_processed_orders").insert(row);

    if (insErr) {
      const code = (insErr as { code?: string }).code;
      if (code === "23505") {
        return NextResponse.json({ ok: true });
      }
      console.error("[webhook] idempotency insert failed:", insErr);
      await admin.schema("isendai").from("lemon_webhook_events").delete().eq("event_key", dedupeKey);
      return NextResponse.json({ error: "Persistence error." }, { status: 500 });
    }

    const maxVersions = owner_type === "anon" ? 2 : 5;
    const { error: entErr } = await billingEnsureEntitlement(admin, {
      p_owner_type: owner_type,
      p_owner_id: owner_id,
      p_default_credits: 0,
      p_default_max_versions: maxVersions,
    });
    if (entErr) {
      console.error("[webhook] ensure entitlement failed:", entErr);
      await admin.schema("isendai").from("lemon_processed_orders").delete().eq("order_identifier", orderIdentifier);
      await admin.schema("isendai").from("lemon_webhook_events").delete().eq("event_key", dedupeKey);
      return NextResponse.json({ error: "Billing error." }, { status: 500 });
    }

    const { error: creditErr } = await billingAddCredits(admin, {
      p_owner_type: owner_type,
      p_owner_id: owner_id,
      p_amount: credits,
    });

    if (creditErr) {
      console.error("[webhook] add_credits failed:", creditErr);
      await admin.schema("isendai").from("lemon_processed_orders").delete().eq("order_identifier", orderIdentifier);
      await admin.schema("isendai").from("lemon_webhook_events").delete().eq("event_key", dedupeKey);
      return NextResponse.json({ error: "Billing error." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
