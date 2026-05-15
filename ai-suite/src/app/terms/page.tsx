import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";

import { TermsEnBody } from "@/app/legal/terms-en-body";
import { TermsTrBody } from "@/app/legal/terms-tr-body";
import { pageMain } from "@/lib/page-layout";
import { cn } from "@/lib/utils";
import { textGradientHero } from "@/lib/premium-ui";
import { DICTS, type Locale } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";

export async function generateMetadata(): Promise<Metadata> {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const d = DICTS[locale];
  return {
    title: `${d["legal.termsTitle"]} | isendai`,
    description:
      "Terms of Service for isendai. AI writing tools with subscriptions and credit packs.",
  };
}

export default async function TermsPage() {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const d = DICTS[locale];
  const year = String(new Date().getFullYear());

  return (
    <main className={pageMain("legal")}>
      <div className="mb-8">
        <Link className="text-sm font-medium text-violet-300 hover:text-violet-200" href="/">
          ← {d["nav.backToHome"]}
        </Link>
      </div>
      <h1 className={cn("text-pretty text-3xl font-semibold tracking-tight", textGradientHero)}>
        {d["legal.termsTitle"]}
      </h1>
      <p className="mt-3 text-sm text-slate-400">{d["legal.effective"].replace("{year}", year)}</p>
      {locale !== "en" && locale !== "tr" ? (
        <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {d["legal.shellNotice"]}
        </p>
      ) : null}
      <p className="mt-3 text-sm text-slate-400">{d["legal.paymentsStub"]}</p>

      {locale === "tr" ? <TermsTrBody /> : <TermsEnBody />}
    </main>
  );
}
