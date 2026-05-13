import Link from "next/link";

import { DICTS, type Locale } from "@/i18n/dictionaries";
import { glassInteractive, premiumCta, textGradientHero } from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

type Props = {
  locale: Locale;
  title: string;
  detail: string;
};

export function ClaimErrorPanel({ locale, title, detail }: Props) {
  const d = DICTS[locale];
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className={cn("rounded-2xl p-6", glassInteractive)}>
        <h1 className={cn("text-xl font-semibold tracking-tight sm:text-2xl", textGradientHero)}>{title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-400">{detail}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={premiumCta} href="/">
            {d["nav.backToHome"]}
          </Link>
          <Link
            className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm text-slate-200 backdrop-blur-xl transition-all hover:border-violet-500/35 hover:bg-white/[0.07]"
            href="/account"
          >
            {d["nav.account"]}
          </Link>
        </div>
      </div>
    </main>
  );
}
