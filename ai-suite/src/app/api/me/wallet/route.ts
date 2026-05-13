import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ANON_COOKIE } from "@/lib/isendai/anon-cookie";
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

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const { data: sess } = await supabase.auth.getSession();
    const user = auth.user ?? sess.session?.user ?? null;
    const ownerType: "user" | "anon" = user ? "user" : "anon";
    const anonFromCookie = (await cookies()).get(ANON_COOKIE)?.value;
    const ownerId = user?.id ?? anonFromCookie;
    if (!ownerId) {
      return NextResponse.json({
        credits: 0,
        trial_days_left: null,
        subscription_status: null,
      });
    }

    const admin = createSupabaseAdminClient();
    const { data: row } = await admin
      .schema("isendai")
      .from("entitlements")
      .select("credits_balance,trial_ends_at,subscription_status")
      .eq("owner_type", ownerType)
      .eq("owner_id", ownerId)
      .maybeSingle();

    const credits = row?.credits_balance ?? 0;
    const trial =
      trialDaysLeft(
        typeof row?.trial_ends_at === "string" ? row.trial_ends_at : null,
        typeof row?.subscription_status === "string" ? row.subscription_status : null
      );

    return NextResponse.json({
      credits,
      trial_days_left: trial,
      subscription_status: row?.subscription_status ?? null,
    });
  } catch {
    return NextResponse.json({ credits: 0, trial_days_left: null, subscription_status: null });
  }
}
