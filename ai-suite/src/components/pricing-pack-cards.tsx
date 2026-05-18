"use client";

import * as React from "react";
import { Info, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { glassInteractive, glassSurface, premiumCta } from "@/lib/premium-ui";
import { Button } from "@/components/ui/button";

export type PricingPackRow = {
  id: string;
  label: string;
  price: string;
  pack: string;
  summary: string;
  /** Newline-separated bullet lines for the info modal */
  detail: string;
  extra?: string;
  cardClassName?: string;
};

type Props = {
  packs: PricingPackRow[];
  detailModalTitle: string;
  infoButtonAria: string;
  closeLabel: string;
  buyButtonLabel?: string;
  busyPackId?: string | null;
  onBuyPack?: (packId: string) => void | Promise<void>;
  gridClassName?: string;
};

function fillPack(template: string, packLabel: string) {
  return template.replace(/\{tier\}/g, packLabel).replace(/\{pack\}/g, packLabel);
}

function detailBullets(detail: string) {
  return detail
    .split("\n")
    .map((line) => line.replace(/^[•\-]\s*/, "").trim())
    .filter(Boolean);
}

export function PricingPackCards({
  packs,
  detailModalTitle,
  infoButtonAria,
  closeLabel,
  buyButtonLabel,
  busyPackId,
  onBuyPack,
  gridClassName,
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

  const openPack = openId ? packs.find((p) => p.id === openId) : null;

  return (
    <>
      <div className={cn("mt-5 grid gap-4 md:grid-cols-3", gridClassName)}>
        {packs.map((pack) => (
          <div
            key={pack.id}
            className={cn("flex flex-col rounded-2xl p-6", glassInteractive, pack.cardClassName)}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-xs font-semibold uppercase tracking-wide text-slate-300">
                {pack.label}
              </p>
              <button
                type="button"
                className={cn(
                  "shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors",
                  "hover:bg-white/[0.08] hover:text-violet-300",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                )}
                aria-label={fillPack(infoButtonAria, pack.label)}
                onClick={() => setOpenId(pack.id)}
              >
                <Info className="size-4" strokeWidth={2} aria-hidden />
              </button>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{pack.price}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-violet-300/85">
              {pack.pack}
            </p>
            <p className="mt-3 flex-1 text-sm leading-snug text-slate-400">{pack.summary}</p>
            {pack.extra ? (
              <p className="mt-2 text-xs font-medium text-emerald-400/90">{pack.extra}</p>
            ) : null}
            {buyButtonLabel && onBuyPack ? (
              <Button
                type="button"
                className={cn("mt-5 w-full font-semibold", premiumCta)}
                disabled={busyPackId !== null && busyPackId !== undefined}
                onClick={() => void onBuyPack(pack.id)}
              >
                {busyPackId === pack.id ? "…" : buyButtonLabel}
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      {openPack ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className={cn(
              "absolute inset-0 transition-opacity",
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
            aria-labelledby="pack-detail-title"
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
            <h3 id="pack-detail-title" className="pr-10 text-lg font-semibold tracking-tight text-white">
              {fillPack(detailModalTitle, openPack.label)}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {detailBullets(openPack.detail).map((line) => (
                <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-400" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
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

export { PricingPackCards as PricingPaygoTierCards };
export type { PricingPackRow as PaygoTierRow };
