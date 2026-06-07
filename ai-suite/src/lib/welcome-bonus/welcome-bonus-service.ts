import type { User } from "@supabase/supabase-js";

import { WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE } from "@/lib/welcome-bonus/constants";
import { isMembershipProfileComplete } from "@/lib/auth/membership-profile";
import { ensureUserEntitlementsBootstrap } from "@/lib/isendai/ensure-user-entitlements";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export type WelcomeBonusStatus =
  | { status: "granted"; credits: number }
  | { status: "already_granted"; credits: number }
  | { status: "pending_email_verification" }
  | { status: "pending_profile" }
  | { status: "not_configured" }
  | { status: "error"; message: string };

function emailIsConfirmed(user: User): boolean {
  return Boolean(user.email_confirmed_at);
}

export async function processWelcomeBonusForUserId(
  userId: string
): Promise<WelcomeBonusStatus> {
  const id = userId?.trim();
  if (!id) {
    return { status: "error", message: "missing_user_id" };
  }

  const admin = createSupabaseAdminClientOrNull();
  if (!admin) {
    return { status: "not_configured" };
  }

  await ensureUserEntitlementsBootstrap(id);

  const { error: rpcError } = await admin.rpc("process_welcome_bonus_for_user", {
    p_user_id: id,
  });

  if (rpcError) {
    const msg = rpcError.message ?? "rpc_failed";
    if (process.env.NODE_ENV === "development") {
      console.warn("[welcome-bonus] RPC failed:", msg);
    }
    return { status: "error", message: msg };
  }

  return readWelcomeBonusStatus(admin, id);
}

async function resolveAuthUserForBonus(user: User): Promise<User> {
  const admin = createSupabaseAdminClientOrNull();
  if (!admin) return user;

  const { data: authRow } = await admin.auth.admin.getUserById(user.id);
  return authRow?.user ?? user;
}

export async function processWelcomeBonusForUser(user: User): Promise<WelcomeBonusStatus> {
  const authUser = await resolveAuthUserForBonus(user);

  if (!emailIsConfirmed(authUser)) {
    return { status: "pending_email_verification" };
  }
  if (!isMembershipProfileComplete(authUser.user_metadata)) {
    return { status: "pending_profile" };
  }
  return processWelcomeBonusForUserId(authUser.id);
}

async function readWelcomeBonusStatus(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClientOrNull>>,
  userId: string
): Promise<WelcomeBonusStatus> {
  const { data, error } = await admin
    .schema("isendai")
    .from("welcome_bonus_grants")
    .select("status, credits_tenths")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { status: "error", message: error.message };
  }

  if (!data) {
    const { data: authRow } = await admin.auth.admin.getUserById(userId);
    const authUser = authRow?.user;
    if (!authUser) {
      return { status: "error", message: "user_not_found" };
    }
    if (!emailIsConfirmed(authUser)) {
      return { status: "pending_email_verification" };
    }
    if (!isMembershipProfileComplete(authUser.user_metadata)) {
      return { status: "pending_profile" };
    }

    const { error: retryErr } = await admin.rpc("process_welcome_bonus_for_user", {
      p_user_id: userId,
    });
    if (retryErr) {
      return { status: "error", message: retryErr.message ?? "rpc_retry_failed" };
    }

    const { data: retryRow, error: retryReadErr } = await admin
      .schema("isendai")
      .from("welcome_bonus_grants")
      .select("status, credits_tenths")
      .eq("user_id", userId)
      .maybeSingle();

    if (retryReadErr) {
      return { status: "error", message: retryReadErr.message };
    }
    if (!retryRow) {
      return { status: "error", message: "welcome_bonus_not_granted" };
    }

    const retry = retryRow as { status: string; credits_tenths: number };
    if (retry.status === "granted") {
      const credits =
        retry.credits_tenths > 0
          ? retry.credits_tenths / 10
          : WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE;
      return { status: "granted", credits };
    }

    return { status: "already_granted", credits: WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE };
  }

  const row = data as { status: string; credits_tenths: number };
  if (row.status === "granted") {
    const credits =
      row.credits_tenths > 0
        ? row.credits_tenths / 10
        : WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE;
    return { status: "granted", credits };
  }

  if (row.status === "blocked") {
    return { status: "error", message: "welcome_bonus_blocked" };
  }

  return { status: "already_granted", credits: WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE };
}
