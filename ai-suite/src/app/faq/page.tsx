import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";

import { FaqList } from "@/app/faq/faq-list";
import { DICTS, type Locale } from "@/i18n/dictionaries";
import { getFaqContent } from "@/i18n/faq-content";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { pageMain } from "@/lib/page-layout";
import { textGradientHero } from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const faq = getFaqContent(locale);
  return {
    title: `${faq.title} | isendai`,
    description: faq.metaDescription,
  };
}

export default async function FaqPage() {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const d = DICTS[locale];
  const faq = getFaqContent(locale);

  return (
    <main className={pageMain("legal")}>
      <div className="mb-8">
        <Link className="text-sm font-medium text-violet-300 hover:text-violet-200" href="/">
          ← {d["nav.backToHome"]}
        </Link>
      </div>
      <h1 className={cn("text-pretty text-3xl font-semibold tracking-tight", textGradientHero)}>
        {faq.title}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">{faq.intro}</p>

      <FaqList items={faq.items} />
    </main>
  );
}
