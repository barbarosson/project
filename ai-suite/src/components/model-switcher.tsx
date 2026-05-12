"use client";

import { SlidersHorizontal } from "lucide-react";

import type { ToolName } from "@/components/ai-suite/tools";
import {
  MODELS,
  modelSalesTier,
  modelTierOptgroupLabel,
  type ConcreteModelId,
  type ModelId,
  type ModelSalesTier,
} from "@/models/models";
import { useModel } from "@/models/model-provider";
import { useI18n } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import { glassSurface } from "@/lib/premium-ui";

const TIER_ORDER: ModelSalesTier[] = ["budget", "standard", "premium"];

export function ModelSwitcher({
  className,
  tool,
  model: controlledModel,
  onModelChange,
}: {
  className?: string;
  tool?: ToolName;
  /** When both are set, the switcher is controlled and ignores global `useModel`. */
  model?: ModelId;
  onModelChange?: (model: ModelId) => void;
}) {
  const { t } = useI18n();
  const global = useModel();
  void tool;

  const controlled = controlledModel !== undefined && onModelChange !== undefined;
  const model = controlled ? controlledModel : global.model;
  const setModel = controlled ? onModelChange : global.setModel;

  const autoEntry = MODELS.find((m) => m.id === "auto");
  const concrete = MODELS.filter((m) => m.id !== "auto");

  return (
    <label
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300",
        glassSurface,
        className
      )}
    >
      <SlidersHorizontal className="size-4 shrink-0 text-indigo-400" strokeWidth={1.5} />
      <select
        className={cn(
          "min-w-0 max-w-full flex-1 rounded-md border border-white/[0.12] bg-zinc-950/95 px-2 py-1 text-sm text-zinc-100 shadow-inner outline-none",
          "focus:ring-2 focus:ring-violet-500/35"
        )}
        value={model}
        onChange={(e) => setModel(e.target.value as ModelId)}
        aria-label={t("modelSwitcher.ariaLabel")}
      >
        {autoEntry ? (
          <option key={autoEntry.id} value={autoEntry.id}>
            {autoEntry.label}
          </option>
        ) : null}
        {TIER_ORDER.map((tier) => (
          <optgroup key={tier} label={modelTierOptgroupLabel(tier)}>
            {concrete
              .filter((m) => modelSalesTier(m.id as ConcreteModelId) === tier)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
