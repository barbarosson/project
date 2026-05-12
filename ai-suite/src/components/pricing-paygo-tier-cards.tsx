"use client";

import * as React from "react";
import { Info, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { glassInteractive, glassSurface, premiumCta } from "@/lib/premium-ui";
import { Button } from "@/components/ui/button";

export type PaygoTierRow = {
  id: string;
  label: string;
  price: string;
  pack: string;
  summary: string;
  detail: string;
};

type Props = {
  tiers: PaygoTierRow[];
  detailModalTitle: string;
  infoButtonAria: string;
  closeLabel: string;
  buyButtonLabel?: string;
  busyTierId?: string | null;
  onBuyTier?: (tierId: string) => void | Promise<void>;
};

function fillTier(template: string, tierLabel: string) {
  return template.replace(/\{tier\}/g, tierLabel);
}

export function PricingPaygoTierCards({
  tiers,
  detailModalTitle,
  infoButtonAria,
  closeLabel,
  buyButtonLabel,
  busyTierId,
  onBuyTier,
}: Props) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const dialogPanelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!openId) return;
    const el = dialogPanelRef.current;
    if (!el) return;
    window.requestAnimationFrame(() => {
      el.focus();
    });
  }, [openId]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    if (openId) {
      document.addEventListener("keydown", onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [openId]);

  const openTier = openId ? tiers.find((t) => t.id === openId) : null;

  return (
    <>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <div key={tier.id} className={cn("rounded-2xl p-6", glassInteractive)}>
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-xs font-semibold text-slate-300">{tier.label}</p>
              <button
                type="button"
                className={cn(
                  "shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors",
                  "hover:bg-white/[0.08] hover:text-violet-300",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                )}
                aria-label={fillTier(infoButtonAria, tier.label)}
                onClick={() => setOpenId(tier.id)}
              >
                <Info className="size-4" strokeWidth={2} aria-hidden />
              </button>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{tier.price}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-violet-300/85">{tier.pack}</p>
            <p className="mt-3 text-sm leading-snug text-slate-400">{tier.summary}</p>
            {buyButtonLabel && onBuyTier ? (
              <Button
                type="button"
                className={cn("mt-5 w-full font-semibold", premiumCta)}
                disabled={busyTierId !== null && busyTierId !== undefined}
                onClick={() => void onBuyTier(tier.id)}
              >
                {busyTierId === tier.id ? "…" : buyButtonLabel}
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      {openTier ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className={cn(
              "absolute inset-0 transition-opacity",
              /* Same tokens as page body + route overlay — not flat black */
              "bg-background/50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40"
            )}
            aria-label={closeLabel}
            onClick={() => setOpenId(null)}
          />
          <div
            ref={dialogPanelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="paygo-detail-title"
            className={cn(
              "relative z-[101] max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-2xl",
              glassSurface
            )}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              onClick={() => setOpenId(null)}
              aria-label={closeLabel}
            >
              <X className="size-4" strokeWidth={1.5} />
            </button>
            <h3 id="paygo-detail-title" className="pr-10 text-lg font-semibold tracking-tight text-white">
              {fillTier(detailModalTitle, openTier.label)}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">{openTier.detail}</p>
            <button
              type="button"
              className={cn(
                "mt-6 w-full rounded-xl py-2.5 text-sm font-medium",
                "border border-white/[0.12] bg-white/[0.06] text-slate-200 transition-colors hover:bg-white/[0.1]"
              )}
              onClick={() => setOpenId(null)}
            >
              {closeLabel}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
