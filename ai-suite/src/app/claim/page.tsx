import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAnonId } from "@/lib/isendai/owner";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ClaimPage() {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login?next=%2Fclaim");

  const anonId = await getOrCreateAnonId();
  const admin = createSupabaseAdminClient();

  // Move anon credits to user credits.
  const { data: anonEnt } = await admin
    .schema("isendai")
    .from("entitlements")
    .select("credits_balance,max_versions_per_request")
    .eq("owner_type", "anon")
    .eq("owner_id", anonId)
    .maybeSingle();

  await admin.rpc("ensure_entitlement", {
    p_owner_type: "user",
    p_owner_id: user.id,
    p_default_credits: 0,
    p_default_max_versions: 5,
  });

  if (anonEnt && anonEnt.credits_balance > 0) {
    const { data: userEnt } = await admin
      .schema("isendai")
      .from("entitlements")
      .select("credits_balance")
      .eq("owner_type", "user")
      .eq("owner_id", user.id)
      .maybeSingle();
    const nextCredits = (userEnt?.credits_balance ?? 0) + anonEnt.credits_balance;

    await admin
      .schema("isendai")
      .from("entitlements")
      .update({ credits_balance: nextCredits })
      .eq("owner_type", "user")
      .eq("owner_id", user.id);

    // Zero out anon credits to avoid double-spend.
    await admin
      .schema("isendai")
      .from("entitlements")
      .update({ credits_balance: 0 })
      .eq("owner_type", "anon")
      .eq("owner_id", anonId);
  }

  // Move anon requests to user (history + versions).
  await admin
    .schema("isendai")
    .from("requests")
    .update({ owner_type: "user", owner_id: user.id })
    .eq("owner_type", "anon")
    .eq("owner_id", anonId);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{d["claim.title"]}</h1>
      <p className="mt-2 text-sm text-slate-300">{d["claim.description"]}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950" href="/account">
          {d["nav.account"]}
        </Link>
        <Link className="rounded-md border border-white/10 bg-slate-900/40 px-4 py-2 text-sm text-slate-200" href="/">
          {d["nav.backToHome"]}
        </Link>
      </div>
    </main>
  );
}
