import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAnonId } from "@/lib/isendai/owner";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { glassInteractive, premiumCta, textGradientHero } from "@/lib/premium-ui";

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
      <div className={cn("rounded-2xl p-6", glassInteractive)}>
        <h1 className={cn("text-2xl font-semibold tracking-tight sm:text-3xl", textGradientHero)}>
          {d["claim.title"]}
        </h1>
        <p className="mt-2 text-sm text-slate-400">{d["claim.description"]}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={premiumCta} href="/account">
            {d["nav.account"]}
          </Link>
          <Link
            className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm text-slate-200 backdrop-blur-xl transition-all hover:border-violet-500/35 hover:bg-white/[0.07]"
            href="/"
          >
            {d["nav.backToHome"]}
          </Link>
        </div>
      </div>
    </main>
  );
}
