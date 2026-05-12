"use client";

import { SlidersHorizontal } from "lucide-react";

import type { ToolName } from "@/components/ai-suite/tools";
import { MODELS, salesPriceForModel, type ModelId } from "@/models/models";
import { useModel } from "@/models/model-provider";
import { cn } from "@/lib/utils";
import { glassSurface } from "@/lib/premium-ui";

export function ModelSwitcher({ className, tool }: { className?: string; tool?: ToolName }) {
  const { model, setModel } = useModel();
  void tool;

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
        aria-label="Model"
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label} · {salesPriceForModel(m.id).listLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

