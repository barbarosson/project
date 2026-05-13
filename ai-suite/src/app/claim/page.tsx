import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ClaimErrorPanel } from "@/app/claim/claim-error-panel";
import { SiteLocaleToolbar } from "@/components/site-locale-toolbar";
import { DICTS, type Locale } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { billingEnsureEntitlement } from "@/lib/isendai/billing-rpc";
import { getOrCreateAnonId } from "@/lib/isendai/owner";
import { optionalEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { glassInteractive, premiumCta, textGradientHero } from "@/lib/premium-ui";

export const dynamic = "force-dynamic";

async function runGuestToUserClaim(userId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const anonId = await getOrCreateAnonId();
    const admin = createSupabaseAdminClient();

    const { data: anonEnt } = await admin
      .schema("isendai")
      .from("entitlements")
      .select("credits_balance,max_versions_per_request")
      .eq("owner_type", "anon")
      .eq("owner_id", anonId)
      .maybeSingle();

    const { error: entErr } = await billingEnsureEntitlement(admin, {
      p_owner_type: "user",
      p_owner_id: userId,
      p_default_credits: 0,
      p_default_max_versions: 5,
    });
    if (entErr) {
      return { ok: false, message: entErr.message };
    }

    if (anonEnt && anonEnt.credits_balance > 0) {
      const { data: userEnt } = await admin
        .schema("isendai")
        .from("entitlements")
        .select("credits_balance")
        .eq("owner_type", "user")
        .eq("owner_id", userId)
        .maybeSingle();
      const nextCredits = (userEnt?.credits_balance ?? 0) + anonEnt.credits_balance;

      await admin
        .schema("isendai")
        .from("entitlements")
        .update({ credits_balance: nextCredits })
        .eq("owner_type", "user")
        .eq("owner_id", userId);

      await admin
        .schema("isendai")
        .from("entitlements")
        .update({ credits_balance: 0 })
        .eq("owner_type", "anon")
        .eq("owner_id", anonId);
    }

    await admin
      .schema("isendai")
      .from("requests")
      .update({ owner_type: "user", owner_id: userId })
      .eq("owner_type", "anon")
      .eq("owner_id", anonId);

    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export default async function ClaimPage() {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const d = DICTS[locale];

  if (!optionalEnv("SUPABASE_SERVICE_ROLE_KEY")) {
    return (
      <ClaimErrorPanel
        locale={locale}
        title={d["claim.errorTitle"]}
        detail={d["claim.errorServiceRole"]}
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: sess } = await supabase.auth.getSession();
  const user = auth.user ?? sess.session?.user ?? null;
  if (!user) redirect("/login?next=%2Fclaim");

  const result = await runGuestToUserClaim(user.id);
  if (!result.ok) {
    return (
      <ClaimErrorPanel
        locale={locale}
        title={d["claim.errorTitle"]}
        detail={`${d["claim.errorGeneric"]}\n\n${result.message}`}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className={cn("rounded-2xl p-6", glassInteractive)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1
            className={cn(
              "min-w-0 flex-1 text-2xl font-semibold tracking-tight sm:text-3xl",
              textGradientHero
            )}
          >
            {d["claim.title"]}
          </h1>
          <SiteLocaleToolbar className="shrink-0" />
        </div>
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
