"use client";

import { SlidersHorizontal } from "lucide-react";

import { MODELS, type ModelId } from "@/models/models";
import { useModel } from "@/models/model-provider";
import { cn } from "@/lib/utils";

const ALLOWED: ModelId[] = ["gpt-4o-mini", "claude-3-5-haiku-latest", "gpt-4o"];

export function ModelSwitcher({ className }: { className?: string }) {
  const { model, setModel } = useModel();

  return (
    <label
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 backdrop-blur-md",
        className
      )}
    >
      <SlidersHorizontal className="size-4 text-violet-400" />
      <select
        className="min-w-0 max-w-full bg-transparent text-slate-200 outline-none"
        value={model}
        onChange={(e) => setModel(e.target.value as ModelId)}
        aria-label="Model"
      >
        {MODELS.filter((m) => ALLOWED.includes(m.id)).map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </label>
  );
}

