import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { resolvePostLoginDestination } from "@/lib/auth/resolve-post-login-destination";
import { resolvePostLoginNext, safeNext } from "@/lib/auth/safe-next";
import { resolveAuthCallbackOrigin } from "@/lib/site-public-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";
import {
  SitePageChrome,
  SitePageHeader,
  SitePageMain,
} from "@/components/site-page-layout";
import { cn } from "@/lib/utils";
import { pageBackLink, pageContentSection, pageHeroPanel, pageSubtitle, pageTitle } from "@/lib/premium-ui";
import { OAUTH_UI } from "@/lib/auth/oauth-ui";
import { FacebookSignInButton } from "./facebook-sign-in-button";
import { LoginGoogleSignIn } from "./login-google-sign-in";
import { LoginAuthToast } from "./login-auth-toast";
import { LoginOAuthCodeForward } from "./login-oauth-code-forward";
import { LoginReferralCapture } from "@/components/referrals/login-referral-capture";
import { LoginClient } from "./ui";
import { LoginOnboardingCarousel } from "@/components/auth/login-onboarding-carousel";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    ref?: string;
    error?: string;
    detail?: string;
    code?: string;
    token_hash?: string;
    type?: string;
    error_description?: string;
  }>;
}) {
  const sp = await searchParams;

  if (sp.code) {
    const next = safeNext(sp.next);
    const q = new URLSearchParams({ code: sp.code, next });
    if (sp.error) q.set("error", sp.error);
    if (sp.error_description) q.set("error_description", sp.error_description);
    redirect(`/auth/callback?${q.toString()}`);
  }

  if (sp.token_hash && sp.type) {
    const next = safeNext(sp.next);
    const q = new URLSearchParams({
      token_hash: sp.token_hash,
      type: sp.type,
      next,
    });
    redirect(`/auth/callback?${q.toString()}`);
  }

  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user) {
    redirect(resolvePostLoginDestination(auth.user, sp.next));
  }

  const authSnapshot = await readServerAuthSnapshot();
  const h = await headers();
  const origin = resolveAuthCallbackOrigin(h);
  const nextAfterAuth = resolvePostLoginNext(sp.next);
  const authCallbackUrl = origin
    ? `${origin}/auth/callback?next=${encodeURIComponent(nextAfterAuth)}`
    : "";

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="auth">
        <Suspense fallback={null}>
          <LoginOAuthCodeForward />
          <LoginReferralCapture />
          <LoginOnboardingCarousel />
        </Suspense>
        <LoginAuthToast error={sp.error} detail={sp.detail} />
        <div className={cn(pageHeroPanel, pageContentSection, "mt-0 p-6 sm:p-8")}>
          <h1 className={pageTitle}>{d["login.title"]}</h1>
          <p className={cn(pageSubtitle, "mt-2")}>{d["login.subtitle"]}</p>

          {(OAUTH_UI.google || OAUTH_UI.facebook) && (
            <div className="mt-6">
              <div className="grid gap-3">
                {OAUTH_UI.google ? <LoginGoogleSignIn nextAfterAuth={nextAfterAuth} /> : null}
                {OAUTH_UI.facebook ? (
                  <FacebookSignInButton nextAfterAuth={nextAfterAuth} />
                ) : null}
              </div>
            </div>
          )}

          <div className="relative mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.08] light:bg-slate-300/70" aria-hidden />
            <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400 light:text-slate-600">
              {d["login.emailDivider"]}
            </span>
            <span className="h-px flex-1 bg-white/[0.08] light:bg-slate-300/70" aria-hidden />
          </div>

          <div className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-200/90 sm:text-sm">
              {d["login.membershipEmailTitle"]}
            </h2>
            <p className={cn(pageSubtitle, "mt-1")}>{d["login.membershipEmailBody"]}</p>
            <div className="mt-4">
              <LoginClient authCallbackUrl={authCallbackUrl} nextAfterAuth={nextAfterAuth} />
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-slate-200 sm:text-base">
            {d["login.legalLead"]}{" "}
            <Link className={pageBackLink} href="/terms">
              {d["legal.termsTitle"]}
            </Link>{" "}
            {d["login.legalMid"]}{" "}
            <Link className={pageBackLink} href="/privacy">
              {d["legal.privacyTitle"]}
            </Link>
            {d["login.legalEnd"]}
          </p>
          <p className="mt-4 text-center text-sm sm:text-base">
            <Link className={pageBackLink} href="/">
              ← {d["nav.backToHome"]}
            </Link>
          </p>
        </div>
      </SitePageMain>
    </SitePageChrome>
  );
}
