"use client";

import { SlidersHorizontal } from "lucide-react";

import type { ToolName } from "@/components/ai-suite/tools";
import { MODELS, salesPriceForModel, type ModelId } from "@/models/models";
import { useModel } from "@/models/model-provider";
import { cn } from "@/lib/utils";

export function ModelSwitcher({ className, tool }: { className?: string; tool?: ToolName }) {
  const { model, setModel } = useModel();
  void tool;

  return (
    <label
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-slate-900/40 px-3 py-2 text-sm backdrop-blur-md",
        className
      )}
    >
      <SlidersHorizontal className="size-4 text-violet-400" />
      <select
        className={cn(
          "min-w-0 max-w-full rounded-md px-2 py-1 outline-none",
          "bg-white text-slate-950",
          "focus:ring-2 focus:ring-violet-500/30"
        )}
        value={model}
        onChange={(e) => setModel(e.target.value as ModelId)}
        aria-label="Model"
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label} · {salesPriceForModel(m.id).label}
          </option>
        ))}
      </select>
    </label>
  );
}

