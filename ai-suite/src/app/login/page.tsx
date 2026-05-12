import { cookies } from "next/headers";
import Link from "next/link";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
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

export default async function LoginPage() {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];
  const guest = await loadGuestCreditsSnapshot();

  return (
    <main className="mx-auto w-full max-w-md px-4 py-14">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md">
        <h1 className="text-2xl font-semibold tracking-tight">{d["login.title"]}</h1>
        <p className="mt-2 text-sm text-slate-300">{d["login.subtitle"]}</p>
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
        <div className="mt-6 border-t border-white/10 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">
            {d["login.membershipEmailTitle"]}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{d["login.membershipEmailBody"]}</p>
          <div className="mt-4">
            <LoginClient />
          </div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">
            {d["login.membershipGoogleTitle"]}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{d["login.membershipGoogleBody"]}</p>
          <div className="mt-4">
            <GoogleSignInButton />
          </div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">
            {d["login.membershipFacebookTitle"]}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{d["login.membershipFacebookBody"]}</p>
          <div className="mt-4">
            <FacebookSignInButton />
          </div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">
            {d["login.membershipOtherTitle"]}
          </h2>
          <div className="mt-4">
            <OAuthLoginButtons />
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
