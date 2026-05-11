import { cookies } from "next/headers";
import Link from "next/link";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";

export const dynamic = "force-dynamic";

const TIERS = ["budget", "standard", "premium"] as const;

export default async function PricingPage() {
  const isProd = process.env.NODE_ENV === "production";
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{d["pricing.title"]}</h1>
          <p className="mt-2 text-sm text-slate-300">{d["pricing.subtitle"]}</p>
        </div>
        <Link className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950" href="/">
          {d["nav.backToHome"]}
        </Link>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier}
            className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md"
          >
            <p className="text-xs font-semibold text-slate-300">{d[`pricing.tier.${tier}`]}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {d[`pricing.tier.${tier}Price`]}
            </p>
            <p className="mt-2 text-sm text-slate-300">{d[`pricing.tier.${tier}Desc`]}</p>
            <p className="mt-4 text-xs text-slate-400">{d["pricing.tier.footnote"]}</p>
          </div>
        ))}
      </section>

      {!isProd ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md">
          <h2 className="text-sm font-semibold text-white">{d["pricing.dev.title"]}</h2>
          <p className="mt-2 text-sm text-slate-300">{d["pricing.dev.body"]}</p>
          <pre className="mt-3 overflow-auto rounded-xl border border-white/10 bg-slate-950/30 p-4 text-xs text-slate-200">
{`POST /api/dev/topup
Content-Type: application/json

{ "credits": 10 }`}
          </pre>
          <p className="mt-2 text-xs text-slate-400">{d["pricing.dev.disabled"]}</p>
        </section>
      ) : null}
    </main>
  );
}
