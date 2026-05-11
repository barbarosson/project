import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  await admin.rpc("ensure_entitlement", {
    p_owner_type: ownerType,
    p_owner_id: ownerId,
    p_default_credits: 0,
    p_default_max_versions: ownerType === "anon" ? 2 : 5,
  });

  const { data: before, error: readErr } = await admin
    .schema("isendai")
    .from("entitlements")
    .select("credits_balance")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (readErr || !before) {
    return NextResponse.json({ error: "Topup failed." }, { status: 500 });
  }

  const { error: writeErr } = await admin
    .schema("isendai")
    .from("entitlements")
    .update({ credits_balance: before.credits_balance + amount })
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId);
  if (writeErr) return NextResponse.json({ error: "Topup failed." }, { status: 500 });

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
    entitlements: ent ?? null,
  });
}

