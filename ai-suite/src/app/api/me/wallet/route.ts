import { NextResponse, type NextRequest } from "next/server";

import { ANON_COOKIE } from "@/lib/isendai/anon-cookie";
import { readUserEntitlementWalletFromSession } from "@/lib/isendai/user-wallet-from-session";
import { optionalEnv } from "@/lib/env";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function trialDaysLeft(trialEndsAt: string | null, subscriptionStatus: string | null): number | null {
  if (!trialEndsAt || subscriptionStatus !== "trialing") return null;
  const end = new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) return null;
  const ms = end.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

type WalletDebug = {
  cwdHint: string;
  hasServiceRoleKey: boolean;
  hasPublicSupabaseUrl: boolean;
  hasAlternateSupabaseUrl: boolean;
  signedIn: boolean;
  ownerType: "user" | "anon" | "none";
  ownerIdPrefix: string | null;
  path: string;
  rpcProbe?: { error: string | null; dataKind: string };
  adminRowFound?: boolean;
  /** PostgREST error when reading isendai.entitlements with the service role (see docs/isendai-schema.md). */
  adminError?: string;
  /** Actionable hints when path is admin_error or rpcProbe shows schema cache issues. */
  hints?: string[];
};

export async function GET(req: NextRequest) {
  const debug =
    process.env.NODE_ENV === "development" && req.nextUrl.searchParams.get("debug") === "1";

  const baseDebug = (): WalletDebug => ({
    cwdHint:
      "Env files load from the Next app root (the folder that contains next.config). Run: cd ai-suite && npm run dev",
    hasServiceRoleKey: Boolean(optionalEnv("SUPABASE_SERVICE_ROLE_KEY")?.trim()),
    hasPublicSupabaseUrl: Boolean(optionalEnv("NEXT_PUBLIC_SUPABASE_URL")?.trim()),
    hasAlternateSupabaseUrl: Boolean(optionalEnv("SUPABASE_URL")?.trim()),
    signedIn: false,
    ownerType: "none",
    ownerIdPrefix: null,
    path: "init",
  });

  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const { data: sess } = await supabase.auth.getSession();
    const user = auth.user ?? sess.session?.user ?? null;
    const ownerType: "user" | "anon" = user ? "user" : "anon";
    const anonFromCookie = (await cookies()).get(ANON_COOKIE)?.value;
    const ownerId = (user?.id ?? anonFromCookie)?.trim();

    const dbg = baseDebug();
    dbg.signedIn = Boolean(user);
    dbg.ownerType = !ownerId ? "none" : ownerType;
    dbg.ownerIdPrefix = ownerId ? `${ownerId.slice(0, 8)}…` : null;

    if (!ownerId) {
      dbg.path = "no_owner_id_returns_zero";
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[api/me/wallet] No owner id (not signed in and no anon cookie). credits=0. If you expect a balance, sign in or open the site once to set the guest cookie."
        );
      }
      const body = { credits: 0, trial_days_left: null, subscription_status: null };
      return NextResponse.json(debug ? { ...body, _debug: dbg } : body);
    }

    if (user) {
      if (debug) {
        const probe = await supabase.rpc("user_entitlement_wallet");
        dbg.rpcProbe = {
          error: probe.error?.message ?? null,
          dataKind:
            probe.data == null
              ? "null"
              : Array.isArray(probe.data)
                ? `array(len=${probe.data.length})`
                : typeof probe.data,
        };
      }

      const w = await readUserEntitlementWalletFromSession(supabase);
      if (w !== "rpc_missing") {
        dbg.path = "rpc_row";
        const trial = trialDaysLeft(w.trial_ends_at, w.subscription_status);
        const body = {
          credits: Number(w.credits_balance ?? 0),
          trial_days_left: trial,
          subscription_status: w.subscription_status ?? null,
          max_versions_per_request: Number(w.max_versions_per_request ?? 5) || 5,
        };
        if (
          process.env.NODE_ENV === "development" &&
          ownerType === "user" &&
          Number(w.credits_balance ?? 0) === 0
        ) {
          console.warn(
            "[api/me/wallet] RPC returned credits_balance=0 for a signed-in user. If Supabase shows a higher balance, check isendai.entitlements.owner_id matches auth.users.id, or use ?debug=1 on this route."
          );
        }
        return NextResponse.json(debug ? { ...body, _debug: dbg } : body);
      }
    }

    const admin = createSupabaseAdminClientOrNull();
    if (!admin) {
      dbg.path = "no_service_role_fallback";
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[api/me/wallet] Session wallet unavailable and SUPABASE_SERVICE_ROLE_KEY missing or not loaded. Ensure ai-suite/.env.local contains SUPABASE_SERVICE_ROLE_KEY and you run `cd ai-suite && npm run dev`."
        );
      }
      const body = {
        credits: null,
        trial_days_left: null,
        subscription_status: null,
      };
      return NextResponse.json(debug ? { ...body, _debug: dbg } : body);
    }

    const { data: row, error: adminErr } = await admin
      .schema("isendai")
      .from("entitlements")
      .select("credits_balance,trial_ends_at,subscription_status")
      .eq("owner_type", ownerType)
      .eq("owner_id", ownerId)
      .maybeSingle();

    dbg.adminRowFound = row != null;
    dbg.path = adminErr ? "admin_error" : row ? "admin_row" : "admin_no_row";
    if (debug && adminErr) {
      dbg.adminError = adminErr.message;
      dbg.hints = [
        "Supabase Dashboard → Project Settings → API → Exposed schemas: add `isendai` (then save). Service-role reads use PostgREST; without exposure, .schema(\"isendai\").from(\"entitlements\") fails.",
        "If RPC probe says the function is missing: SQL Editor → run supabase/APPLY_USER_WALLET_RPC.sql (or migration 20260515120000_user_entitlement_wallet_rpc.sql), then run NOTIFY pgrst, 'reload schema'; or wait ~1 min.",
      ];
    }

    if (
      process.env.NODE_ENV === "development" &&
      ownerType === "user" &&
      !row &&
      !adminErr
    ) {
      console.warn(
        `[api/me/wallet] No isendai.entitlements row for user owner_id=${ownerId}. Credits show as 0. Fix owner_id in SQL to match this UUID, or confirm NEXT_PUBLIC_SUPABASE_URL points at the same Supabase project as the table you inspected.`
      );
    }
    if (process.env.NODE_ENV === "development" && adminErr) {
      console.warn("[api/me/wallet] admin entitlements read error:", adminErr.message);
    }

    const credits = row?.credits_balance ?? 0;
    const trial = trialDaysLeft(
      typeof row?.trial_ends_at === "string" ? row.trial_ends_at : null,
      typeof row?.subscription_status === "string" ? row.subscription_status : null
    );

    const body = {
      credits,
      trial_days_left: trial,
      subscription_status: row?.subscription_status ?? null,
    };
    return NextResponse.json(debug ? { ...body, _debug: dbg } : body);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[api/me/wallet]", e);
    }
    const body = { credits: 0, trial_days_left: null, subscription_status: null };
    const dbg = baseDebug();
    dbg.path = "catch";
    return NextResponse.json(debug ? { ...body, _debug: dbg } : body);
  }
}
