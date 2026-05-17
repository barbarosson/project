import {
  modelsGroupedByUserFacingTier,
  USER_MODEL_TIER_IDS,
  type UserFacingModelId,
} from "@/models/models";
import { cn } from "@/lib/utils";
import { glassInteractive, glassSurface, textGradientHero } from "@/lib/premium-ui";

type Dict = Record<string, string>;

const TIER_TITLE_KEY: Record<
  UserFacingModelId,
  "modelSwitcher.fast" | "modelSwitcher.pro" | "modelSwitcher.genius"
> = {
  "fast-ai": "modelSwitcher.fast",
  "pro-ai": "modelSwitcher.pro",
  "genius-ai": "modelSwitcher.genius",
};

const TIER_ACCENT: Record<UserFacingModelId, string> = {
  "fast-ai": "border-emerald-500/25 bg-emerald-500/[0.04]",
  "pro-ai": "border-violet-500/25 bg-violet-500/[0.04]",
  "genius-ai": "border-amber-500/25 bg-amber-500/[0.04]",
};

const TIER_HEADING: Record<UserFacingModelId, string> = {
  "fast-ai": "text-emerald-300/90",
  "pro-ai": "text-violet-300/90",
  "genius-ai": "text-amber-300/90",
};

export function PricingModelClassNote({ d }: { d: Dict }) {
  const grouped = modelsGroupedByUserFacingTier();

  return (
    <section className="mt-10 scroll-mt-24" aria-labelledby="pricing-model-classes-heading">
      <h2
        id="pricing-model-classes-heading"
        className={cn("text-lg font-semibold tracking-tight", textGradientHero)}
      >
        {d["pricing.modelNote.title"]}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{d["pricing.modelNote.lead"]}</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {USER_MODEL_TIER_IDS.map((tier) => (
          <div
            key={tier}
            className={cn(
              "rounded-2xl border p-5 backdrop-blur-md",
              TIER_ACCENT[tier],
              glassInteractive
            )}
          >
            <h3 className={cn("text-sm font-semibold", TIER_HEADING[tier])}>{d[TIER_TITLE_KEY[tier]]}</h3>
            <ul className="mt-3 space-y-1.5 text-sm leading-snug text-slate-300">
              {grouped[tier].map((m) => (
                <li key={m.id} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-500" aria-hidden />
                  <span>{m.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className={cn("mt-4 rounded-xl px-4 py-3 text-xs leading-relaxed text-slate-500", glassSurface)}>
        {d["pricing.modelNote.packHint"]}
      </p>
    </section>
  );
}
