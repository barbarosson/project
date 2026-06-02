import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import { NextResponse } from "next/server";

import { getToolDefinition, isToolName } from "@/components/ai-suite/tools";
import { isLiveCheckoutExpected } from "@/lib/billing/lemon-merchant-status";
import { resolveVariantId, type CheckoutPackKey, type PaygoTierKey } from "@/lib/lemonsqueezy/catalog";
import { isMembershipProfileComplete } from "@/lib/auth/membership-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { trialNetworkFingerprint, trialOwnerFingerprint } from "@/lib/trial/fingerprint";

export const runtime = "nodejs";

function siteUrl(request: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const u = new URL(request.url);
  return `${u.protocol}//${u.host}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function lemonErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Could not start checkout.";
  const cause = error.cause;
  if (typeof cause === "string" && cause.trim()) return cause;
  if (Array.isArray(cause) && cause.length > 0) {
    const parts = cause
      .map((item) => {
        if (!isRecord(item)) return null;
        const detail = item.detail ?? item.title;
        return typeof detail === "string" ? detail : null;
      })
      .filter((s): s is string => Boolean(s));
    if (parts.length) return parts.join("; ");
  }
  return error.message || "Could not start checkout.";
}

export async function POST(request: Request) {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY?.trim();
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID?.trim();
  if (!apiKey || !storeId) {
    return NextResponse.json({ error: "Lemon Squeezy is not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const rec = isRecord(body) ? body : {};
  const tool_id =
    typeof rec.tool_id === "string" && isToolName(rec.tool_id) ? rec.tool_id : "corporate-whisperer";

  let pack: CheckoutPackKey;
  if (rec.pack === "subscription" && (rec.plan === "basic" || rec.plan === "pro" || rec.plan === "ultra")) {
    const interval = rec.billing_interval === "yearly" ? "yearly" : "monthly";
    pack = { kind: "subscription", plan: rec.plan, interval };
  } else if (
    rec.pack === "paygo" &&
    (rec.tier === "budget" || rec.tier === "standard" || rec.tier === "premium")
  ) {
    pack = { kind: "paygo", tier: rec.tier as PaygoTierKey };
  } else {
    pack = { kind: "one_time_trial" };
  }

  const variantId = resolveVariantId(pack);
  if (!variantId) {
    return NextResponse.json(
      {
        error:
          "Missing Lemon variant env for this pack. Set LEMON_SQUEEZY_VARIANT_* in .env.local (see README).",
        code: "missing_variant",
      },
      { status: 503 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in required to purchase credits.", code: "auth_required" },
      { status: 401 }
    );
  }

  if (!isMembershipProfileComplete(userData.user?.user_metadata)) {
    return NextResponse.json(
      {
        error: "Complete your membership profile before purchasing.",
        code: "profile_required",
      },
      { status: 403 }
    );
  }

  const owner_type = "user" as const;
  const owner_id = userId;

  const admin = createSupabaseAdminClient();
  if (pack.kind === "subscription") {
    const fpOwner = trialOwnerFingerprint(owner_type, owner_id);
    const { data: used } = await admin
      .schema("isendai")
      .from("trial_abuse_guard")
      .select("fingerprint")
      .eq("fingerprint", fpOwner)
      .maybeSingle();
    if (used) {
      return NextResponse.json(
        {
          error: "Subscription trial is only available once per account.",
          code: "trial_unavailable",
        },
        { status: 403 }
      );
    }
  }

  if (pack.kind === "subscription" && process.env.ISENDAI_STRICT_TRIAL_IP === "1") {
    const fpNet = trialNetworkFingerprint(owner_type, owner_id, request);
    const { data: netUsed } = await admin
      .schema("isendai")
      .from("trial_abuse_guard")
      .select("fingerprint")
      .eq("fingerprint", fpNet)
      .maybeSingle();
    if (netUsed) {
      return NextResponse.json({ error: "Trial unavailable from this network.", code: "trial_ip_blocked" }, { status: 403 });
    }
  }

  const def = getToolDefinition(tool_id);
  const storageKey = def.storageKey;
  const modelStorageKey = `${storageKey}:model`;

  lemonSqueezySetup({ apiKey });

  const redirectUrl = `${siteUrl(request)}/success?tool=${encodeURIComponent(tool_id)}&paid=1`;

  const clientModel = typeof rec.model === "string" ? rec.model : "";

  // checkout_data only supports email, name, billing_address, custom, etc. — not trial_period_days.
  // Free trial length must be set on the Lemon subscription product/variant (e.g. 7 days).
  const checkoutData = {
    custom: {
      tool_id,
      owner_type,
      owner_id,
      storage_key: storageKey,
      model_storage_key: modelStorageKey,
      checkout_pack: pack.kind,
      ...(pack.kind === "subscription" ? { plan: pack.plan, billing_interval: pack.interval } : {}),
      ...(pack.kind === "paygo" ? { paygo_tier: pack.tier } : {}),
      ...(clientModel ? { selected_model: clientModel } : {}),
    },
  };

  const liveCheckout = isLiveCheckoutExpected();

  const res = await createCheckout(storeId, variantId, {
    testMode: !liveCheckout,
    checkoutData: checkoutData as never,
    productOptions: {
      redirectUrl,
    },
    checkoutOptions: {
      subscriptionPreview: true,
    },
  });

  if (res.error || !res.data) {
    const message = lemonErrorMessage(res.error);
    console.error("[checkout] Lemon Squeezy error:", res.error, res.data);
    return NextResponse.json(
      {
        error: message,
        code: "lemon_checkout_failed",
      },
      { status: 502 }
    );
  }

  const attrs = res.data.data.attributes as { url?: string; test_mode?: boolean };
  const checkoutUrl = attrs.url;
  if (!checkoutUrl) {
    return NextResponse.json({ error: "Missing checkout URL." }, { status: 502 });
  }

  if (liveCheckout && attrs.test_mode === true) {
    console.error("[checkout] Live deploy received test_mode checkout", { variantId, storeId });
    return NextResponse.json(
      {
        error:
          "Checkout is still in Lemon test mode. In Netlify use a Live-mode API key and Live variant IDs (copy each variant ID while the Live toggle is on in Lemon).",
        code: "lemon_test_mode_mismatch",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ checkout_url: checkoutUrl });
}
