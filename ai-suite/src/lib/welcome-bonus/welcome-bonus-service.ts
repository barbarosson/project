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

type WelcomeBonusAttemptOptions = {
  maxAttempts?: number;
  delayMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emailIsConfirmed(user: User): boolean {
  const u = user as User & { confirmed_at?: string | null };
  return Boolean(user.email_confirmed_at ?? u.confirmed_at);
}

function grantStatusFromRow(row: { status: string; credits_tenths: number }): WelcomeBonusStatus {
  if (row.status === "granted") {
    const credits =
      row.credits_tenths > 0 ? row.credits_tenths / 10 : WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE;
    return { status: "granted", credits };
  }
  if (row.status === "blocked") {
    return { status: "error", message: "welcome_bonus_blocked" };
  }
  return { status: "already_granted", credits: WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE };
}

async function resolveAuthUserForBonus(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClientOrNull>>,
  userId: string
): Promise<User | null> {
  const { data: authRow } = await admin.auth.admin.getUserById(userId);
  return authRow?.user ?? null;
}

async function pendingStatusForUser(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClientOrNull>>,
  userId: string
): Promise<WelcomeBonusStatus> {
  const authUser = await resolveAuthUserForBonus(admin, userId);
  if (!authUser) {
    return { status: "error", message: "user_not_found" };
  }
  if (!emailIsConfirmed(authUser)) {
    return { status: "pending_email_verification" };
  }
  if (!isMembershipProfileComplete(authUser.user_metadata)) {
    return { status: "pending_profile" };
  }
  return { status: "error", message: "welcome_bonus_not_granted" };
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

  if (data) {
    return grantStatusFromRow(data as { status: string; credits_tenths: number });
  }

  return pendingStatusForUser(admin, userId);
}

export async function processWelcomeBonusForUserId(
  userId: string,
  opts?: WelcomeBonusAttemptOptions
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

  const maxAttempts = Math.max(1, opts?.maxAttempts ?? 1);
  const delayMs = Math.max(0, opts?.delayMs ?? 0);
  let lastStatus: WelcomeBonusStatus = { status: "error", message: "welcome_bonus_not_granted" };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0 && delayMs > 0) {
      await sleep(delayMs);
    }

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

    lastStatus = await readWelcomeBonusStatus(admin, id);
    if (lastStatus.status === "granted" || lastStatus.status === "already_granted") {
      return lastStatus;
    }
    if (lastStatus.status === "pending_email_verification" || lastStatus.status === "pending_profile") {
      return lastStatus;
    }
  }

  return lastStatus;
}

export async function processWelcomeBonusForUser(user: User): Promise<WelcomeBonusStatus> {
  const admin = createSupabaseAdminClientOrNull();
  if (!admin) {
    return { status: "not_configured" };
  }

  const authUser = (await resolveAuthUserForBonus(admin, user.id)) ?? user;
  // Retry: profile metadata can lag briefly right after updateUser on the client.
  return processWelcomeBonusForUserId(authUser.id, { maxAttempts: 4, delayMs: 300 });
}
