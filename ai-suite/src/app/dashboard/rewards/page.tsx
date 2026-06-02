import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RewardsDashboardClient } from "@/app/dashboard/rewards/rewards-dashboard-client";
import { DICTS } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";
import { pageMetadataForPath } from "@/lib/site-metadata";
import {
  SitePageChrome,
  SitePageHeader,
  SitePageMain,
} from "@/components/site-page-layout";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const d = DICTS[locale];
  return pageMetadataForPath(
    "/dashboard/rewards",
    `${d["referrals.pageTitle"]} | isendai`,
    d["referrals.metaDescription"],
    locale
  );
}

export default async function RewardsDashboardPage() {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];

  const authSnapshot = await readServerAuthSnapshot();
  if (!authSnapshot.signedIn) {
    redirect("/login?next=%2Fdashboard%2Frewards");
  }

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="narrow" className="pb-16">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-slate-400 sm:text-sm">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-violet-200">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-white/25">
              /
            </li>
            <li className="font-medium text-slate-200" aria-current="page">
              {d["referrals.pageTitle"]}
            </li>
          </ol>
        </nav>
        <RewardsDashboardClient />
      </SitePageMain>
    </SitePageChrome>
  );
}
