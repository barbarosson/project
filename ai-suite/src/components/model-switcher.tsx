"use client";

import { SlidersHorizontal } from "lucide-react";

import type { ToolName } from "@/components/ai-suite/tools";
import {
  modelsPickerGroups,
  USER_MODEL_TIER_IDS,
  type ModelId,
  type UserFacingModelId,
} from "@/models/models";
import { useModel } from "@/models/model-provider";
import { useI18n } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import { glassSurface } from "@/lib/premium-ui";

const TIER_I18N_KEY: Record<UserFacingModelId, "modelSwitcher.fast" | "modelSwitcher.pro" | "modelSwitcher.genius"> = {
  "fast-ai": "modelSwitcher.fast",
  "pro-ai": "modelSwitcher.pro",
  "genius-ai": "modelSwitcher.genius",
};

const PROVIDER_I18N_KEY: Record<
  "openai" | "anthropic" | "google" | "groq" | "deepseek",
  | "modelSwitcher.providerOpenai"
  | "modelSwitcher.providerAnthropic"
  | "modelSwitcher.providerGoogle"
  | "modelSwitcher.providerGroq"
  | "modelSwitcher.providerDeepseek"
> = {
  openai: "modelSwitcher.providerOpenai",
  anthropic: "modelSwitcher.providerAnthropic",
  google: "modelSwitcher.providerGoogle",
  groq: "modelSwitcher.providerGroq",
  deepseek: "modelSwitcher.providerDeepseek",
};

export function ModelSwitcher({
  className,
  tool,
  model: controlledModel,
  onModelChange,
}: {
  className?: string;
  tool?: ToolName;
  model?: ModelId;
  onModelChange?: (model: ModelId) => void;
}) {
  const { t } = useI18n();
  const global = useModel();
  void tool;

  const controlled = controlledModel !== undefined && onModelChange !== undefined;
  const model = controlled ? controlledModel : global.model;
  const setModel = controlled ? onModelChange : global.setModel;

  const pickerGroups = modelsPickerGroups();

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
        <optgroup label={t("modelSwitcher.quickTiers")}>
          <option value="auto">{t("modelSwitcher.auto")}</option>
          {USER_MODEL_TIER_IDS.map((id) => (
            <option key={id} value={id}>
              {t(TIER_I18N_KEY[id])}
            </option>
          ))}
        </optgroup>
        {pickerGroups.map((group) => (
          <optgroup key={group.provider} label={t(PROVIDER_I18N_KEY[group.provider])}>
            {group.models.map((m) => (
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
