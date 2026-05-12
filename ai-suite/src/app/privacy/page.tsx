import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";

import { PrivacyEnBody } from "@/app/legal/privacy-en-body";
import { SiteLocaleToolbar } from "@/components/site-locale-toolbar";
import { DICTS, type Locale } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";

export async function generateMetadata(): Promise<Metadata> {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const d = DICTS[locale];
  return {
    title: `${d["legal.privacyTitle"]} | isendai`,
    description:
      "Privacy Policy for isendai. We may store your inputs and generated results so you can access your history across devices.",
  };
}

export default async function PrivacyPage() {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const d = DICTS[locale];
  const year = String(new Date().getFullYear());

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-medium text-violet-300 hover:text-violet-200" href="/">
          ← {d["nav.backToHome"]}
        </Link>
        <SiteLocaleToolbar />
      </div>
      <h1 className="text-pretty text-3xl font-semibold tracking-tight">{d["legal.privacyTitle"]}</h1>
      <p className="mt-3 text-sm text-slate-300">{d["legal.effective"].replace("{year}", year)}</p>
      {locale !== "en" ? (
        <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {d["legal.shellNotice"]}
        </p>
      ) : null}
      <p className="mt-3 text-sm text-slate-400">{d["legal.paymentsStub"]}</p>

      <PrivacyEnBody />
    </main>
  );
}
