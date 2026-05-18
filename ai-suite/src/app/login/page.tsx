import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { resolvePostLoginNext, safeNext } from "@/lib/auth/safe-next";
import { resolveAuthPublicOrigin } from "@/lib/site-public-url";
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
import { GoogleSignInButton } from "./google-sign-in-button";
import { LoginAuthToast } from "./login-auth-toast";
import { OAuthLoginButtons } from "./oauth-login-buttons";
import { LoginOAuthCodeForward } from "./login-oauth-code-forward";
import { LoginClient } from "./ui";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    error?: string;
    detail?: string;
    code?: string;
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

  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user) {
    redirect(resolvePostLoginNext(sp.next));
  }

  const authSnapshot = await readServerAuthSnapshot();
  const h = await headers();
  const origin = resolveAuthPublicOrigin(h);
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
        </Suspense>
        <LoginAuthToast error={sp.error} detail={sp.detail} />
        <div className={cn(pageHeroPanel, pageContentSection, "mt-0 p-6 sm:p-8")}>
          <h1 className={pageTitle}>{d["login.title"]}</h1>
          <p className={cn(pageSubtitle, "mt-2")}>{d["login.subtitle"]}</p>
          <div className="mt-6 border-t border-white/[0.08] pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-200/90 sm:text-sm">
              {d["login.membershipEmailTitle"]}
            </h2>
            <p className={cn(pageSubtitle, "mt-1")}>{d["login.membershipEmailBody"]}</p>
            <div className="mt-4">
              <LoginClient authCallbackUrl={authCallbackUrl} nextAfterAuth={nextAfterAuth} />
            </div>
          </div>
          {(OAUTH_UI.google || OAUTH_UI.facebook) && (
            <div className="mt-6 border-t border-white/[0.08] pt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-200/90 sm:text-sm">
                {d["login.membershipSocialTitle"]}
              </h2>
              <p className={cn(pageSubtitle, "mt-1")}>{d["login.membershipSocialBody"]}</p>
              <div className="mt-4 grid gap-3">
                {OAUTH_UI.google ? (
                  <GoogleSignInButton authCallbackUrl={authCallbackUrl} />
                ) : null}
                {OAUTH_UI.facebook ? (
                  <FacebookSignInButton authCallbackUrl={authCallbackUrl} />
                ) : null}
              </div>
            </div>
          )}
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
