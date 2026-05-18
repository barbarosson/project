import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  SitePageChrome,
  SitePageHeader,
  SitePageMain,
} from "@/components/site-page-layout";
import { cn } from "@/lib/utils";
import { pageBackLink, pageContentSection, pageHeroPanel, pageSubtitle, pageTitle } from "@/lib/premium-ui";

import { UpdatePasswordForm } from "./update-password-form";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    redirect("/login?next=%2Fauth%2Fupdate-password");
  }

  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];
  const authSnapshot = await readServerAuthSnapshot();

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="auth">
        <div className={cn(pageHeroPanel, pageContentSection, "mt-0 p-6 sm:p-8")}>
          <h1 className={pageTitle}>{d["login.updatePasswordTitle"]}</h1>
          <p className={cn(pageSubtitle, "mt-2")}>{d["login.updatePasswordSubtitle"]}</p>
          <div className="mt-6">
            <UpdatePasswordForm email={user.email ?? null} />
          </div>
          <p className="mt-6 text-center text-sm sm:text-base">
            <Link className={pageBackLink} href="/login">
              ← {d["nav.login"]}
            </Link>
          </p>
        </div>
      </SitePageMain>
    </SitePageChrome>
  );
}
