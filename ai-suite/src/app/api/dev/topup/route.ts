import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { billingAddCredits, billingEnsureEntitlement } from "@/lib/isendai/billing-rpc";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const secret = process.env.DEV_TOPUP_SECRET?.trim();
  if (secret) {
    const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    const headerSecret = req.headers.get("x-dev-topup-secret")?.trim();
    const provided = headerSecret ?? bearer ?? "";
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const body = (await req.json().catch(() => null)) as unknown;
  let amount = 0;
  if (typeof body === "object" && body !== null && "credits" in body) {
    const c = (body as { credits?: unknown }).credits;
    if (typeof c === "number") amount = Math.floor(c);
  }

  if (amount <= 0 || amount > 10000) {
    return NextResponse.json({ error: "Invalid credits amount." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Sign in required for dev top-up." }, { status: 401 });
  }

  const ownerType = "user" as const;
  const ownerId = userId;

  const admin = createSupabaseAdminClient();
  const { error: entErr } = await billingEnsureEntitlement(admin, {
    p_owner_type: ownerType,
    p_owner_id: ownerId,
    p_default_credits: 0,
    p_default_max_versions: 5,
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
