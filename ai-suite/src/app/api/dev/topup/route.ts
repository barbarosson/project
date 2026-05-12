import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { billingAddCredits, billingEnsureEntitlement } from "@/lib/isendai/billing-rpc";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAnonId } from "@/lib/isendai/owner";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  const amount =
    typeof body === "object" &&
    body !== null &&
    "credits" in body &&
    typeof (body as any).credits === "number"
      ? Math.floor((body as any).credits)
      : 0;

  if (amount <= 0 || amount > 10000) {
    return NextResponse.json({ error: "Invalid credits amount." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id ?? null;

  const ownerType: "user" | "anon" = userId ? "user" : "anon";
  const ownerId = userId ?? (await getOrCreateAnonId());

  const admin = createSupabaseAdminClient();
  const { error: entErr } = await billingEnsureEntitlement(admin, {
    p_owner_type: ownerType,
    p_owner_id: ownerId,
    p_default_credits: 0,
    p_default_max_versions: ownerType === "anon" ? 2 : 5,
  });
  if (entErr) return NextResponse.json({ error: entErr.message }, { status: 500 });

  const { data: newBalance, error: incErr } = await billingAddCredits(admin, {
    p_owner_type: ownerType,
    p_owner_id: ownerId,
    p_amount: amount,
  });
  if (incErr) return NextResponse.json({ error: "Topup failed." }, { status: 500 });

  const { data: ent } = await admin
    .schema("isendai")
    .from("entitlements")
    .select("credits_balance,max_versions_per_request")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    owner: { type: ownerType, id: ownerId },
    credits_balance: newBalance ?? null,
    entitlements: ent ?? null,
  });
}

