import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { resolvePostLoginNext } from "@/lib/auth/safe-next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { glassInteractive, textGradientHero } from "@/lib/premium-ui";
import { getOrCreateAnonId } from "@/lib/isendai/owner";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { FacebookSignInButton } from "./facebook-sign-in-button";
import { GoogleSignInButton } from "./google-sign-in-button";
import { OAuthLoginButtons } from "./oauth-login-buttons";
import { LoginClient } from "./ui";

export const dynamic = "force-dynamic";

async function loadGuestCreditsSnapshot(): Promise<{ credits: number; max: number } | null> {
  try {
    const admin = createSupabaseAdminClient();
    const anonId = await getOrCreateAnonId();
    const { data: ent } = await admin
      .schema("isendai")
      .from("entitlements")
      .select("credits_balance,max_versions_per_request")
      .eq("owner_type", "anon")
      .eq("owner_id", anonId)
      .maybeSingle();
    return {
      credits: ent?.credits_balance ?? 0,
      max: ent?.max_versions_per_request ?? 2,
    };
  } catch {
    return null;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];
  const guest = await loadGuestCreditsSnapshot();

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user) {
    const nextAfter = resolvePostLoginNext(sp.next);
    const meta = auth.user.user_metadata as Record<string, unknown> | undefined;
    const completed =
      typeof meta?.profile_completed_at === "string" && meta.profile_completed_at.length > 0;
    const dest = completed ? nextAfter : `/account/profile?next=${encodeURIComponent(nextAfter)}`;
    redirect(dest);
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : "";
  const nextAfterAuth = resolvePostLoginNext(sp.next);
  const authCallbackUrl = origin
    ? `${origin}/auth/callback?next=${encodeURIComponent(nextAfterAuth)}`
    : "";

  return (
    <main className="mx-auto w-full max-w-md px-4 py-14">
      <div className={cn("rounded-2xl p-6", glassInteractive)}>
        <h1 className={cn("text-2xl font-semibold tracking-tight sm:text-3xl", textGradientHero)}>
          {d["login.title"]}
        </h1>
        <p className="mt-2 text-sm text-slate-400">{d["login.subtitle"]}</p>
        {guest ? (
          <div className="mt-4 rounded-xl border border-violet-500/25 bg-violet-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">
              {d["login.creditsTitle"]}
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white">
              {guest.credits}
            </p>
            <p className="mt-1 text-xs text-slate-300">
              {d["login.creditsMax"].replace("{max}", String(guest.max))}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{d["login.creditsHint"]}</p>
          </div>
        ) : null}
        <div className="mt-6 border-t border-white/[0.08] pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">
            {d["login.membershipEmailTitle"]}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{d["login.membershipEmailBody"]}</p>
          <div className="mt-4">
            <LoginClient authCallbackUrl={authCallbackUrl} nextAfterAuth={nextAfterAuth} />
          </div>
        </div>
        <div className="mt-6 border-t border-white/[0.08] pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">
            {d["login.membershipGoogleTitle"]}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{d["login.membershipGoogleBody"]}</p>
          <div className="mt-4">
            <GoogleSignInButton authCallbackUrl={authCallbackUrl} />
          </div>
        </div>
        <div className="mt-6 border-t border-white/[0.08] pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">
            {d["login.membershipFacebookTitle"]}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{d["login.membershipFacebookBody"]}</p>
          <div className="mt-4">
            <FacebookSignInButton authCallbackUrl={authCallbackUrl} />
          </div>
        </div>
        <div className="mt-6 border-t border-white/[0.08] pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">
            {d["login.membershipOtherTitle"]}
          </h2>
          <div className="mt-4">
            <OAuthLoginButtons authCallbackUrl={authCallbackUrl} />
          </div>
        </div>
        <p className="mt-5 text-xs text-slate-400">
          {d["login.legalLead"]}{" "}
          <Link className="text-violet-300 hover:text-violet-200" href="/terms">
            {d["legal.termsTitle"]}
          </Link>{" "}
          {d["login.legalMid"]}{" "}
          <Link className="text-violet-300 hover:text-violet-200" href="/privacy">
            {d["legal.privacyTitle"]}
          </Link>
          {d["login.legalEnd"]}
        </p>
        <p className="mt-4 text-center text-sm">
          <Link className="text-violet-300 hover:text-violet-200" href="/">
            ← {d["nav.backToHome"]}
          </Link>
        </p>
      </div>
    </main>
  );
}
