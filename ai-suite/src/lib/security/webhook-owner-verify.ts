import type { SupabaseClient } from "@supabase/supabase-js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Lemon order/subscription attributes may expose buyer email under several keys. */
export function lemonCustomerEmailFromAttributes(attrs: Record<string, unknown>): string | null {
  const directKeys = ["user_email", "customer_email", "email", "billing_email"];
  for (const key of directKeys) {
    const v = attrs[key];
    if (typeof v === "string" && v.includes("@")) return normalizeEmail(v);
  }
  const customer = attrs.customer;
  if (isRecord(customer) && typeof customer.email === "string" && customer.email.includes("@")) {
    return normalizeEmail(customer.email);
  }
  const user = attrs.user;
  if (isRecord(user) && typeof user.email === "string" && user.email.includes("@")) {
    return normalizeEmail(user.email);
  }
  return null;
}

export type WebhookOwnerVerifyResult =
  | { ok: true }
  | { ok: false; reason: "email_mismatch" | "user_not_found" | "missing_lemon_email" };

/**
 * When owner is a signed-in user, ensure Lemon checkout email matches Supabase auth email
 * so custom `owner_id` cannot be pointed at another account.
 */
export async function verifyWebhookOwnerEmail(
  admin: SupabaseClient,
  ownerType: "user" | "anon",
  ownerId: string,
  attrs: Record<string, unknown>
): Promise<WebhookOwnerVerifyResult> {
  if (ownerType !== "user") return { ok: true };

  const lemonEmail = lemonCustomerEmailFromAttributes(attrs);
  const strictOpt = process.env.ISENDAI_WEBHOOK_STRICT_EMAIL?.trim().toLowerCase();
  const strict =
    strictOpt === "0" || strictOpt === "false" || strictOpt === "no"
      ? false
      : strictOpt === "1" || strictOpt === "true" || strictOpt === "yes" || process.env.NODE_ENV === "production";

  if (!lemonEmail) {
    if (strict) return { ok: false, reason: "missing_lemon_email" };
    return { ok: true };
  }

  const { data, error } = await admin.auth.admin.getUserById(ownerId);
  const authEmail = data?.user?.email;
  if (error || !authEmail) {
    return { ok: false, reason: "user_not_found" };
  }

  if (normalizeEmail(authEmail) !== lemonEmail) {
    return { ok: false, reason: "email_mismatch" };
  }

  return { ok: true };
}

export function logWebhookOwnerRejected(
  eventName: string,
  ownerType: string,
  ownerId: string,
  reason: string
): void {
  console.warn(
    `[webhook] ${eventName} owner verification failed (${reason}) owner=${ownerType}:${ownerId.slice(0, 8)}…`
  );
}
