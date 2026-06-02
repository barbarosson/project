import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";
import {
  SitePageChrome,
  SitePageHeader,
  SitePageMain,
  SitePageSection,
  SitePageTitleBlock,
} from "@/components/site-page-layout";
import { pageOutlineButton, premiumCta } from "@/lib/premium-ui";
import { safeNext } from "@/lib/auth/safe-next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ProfileForm } from "./profile-form";
import { ProfileOauthToast } from "./profile-oauth-toast";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; oauth_email?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next ?? undefined);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/account/profile?next=${encodeURIComponent(next)}`)}`);
  }

  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];

  const meta =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, unknown>)
      : {};

  const authSnapshot = await readServerAuthSnapshot();

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="narrow">
        <ProfileOauthToast oauthEmail={sp.oauth_email} />
        <SitePageTitleBlock
          title={d["profile.title"]}
          subtitle={d["profile.subtitle"]}
          actions={
            <>
              <Link className={pageOutlineButton} href="/account">
                {d["profile.backToAccount"]}
              </Link>
              <Link className={premiumCta} href="/">
                {d["nav.backToHome"]}
              </Link>
            </>
          }
        />
        <SitePageSection className="mt-0">
          <ProfileForm nextPath={next} email={user.email ?? ""} initialMeta={meta} />
        </SitePageSection>
      </SitePageMain>
    </SitePageChrome>
  );
}
