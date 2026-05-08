"use client";

import { SlidersHorizontal } from "lucide-react";

import { MODELS, type ModelId } from "@/models/models";
import { useModel } from "@/models/model-provider";
import { cn } from "@/lib/utils";

export function ModelSwitcher({ className }: { className?: string }) {
  const { model, setModel } = useModel();

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm",
        className
      )}
    >
      <SlidersHorizontal className="size-4 text-muted-foreground" />
      <select
        className="bg-transparent outline-none"
        value={model}
        onChange={(e) => setModel(e.target.value as ModelId)}
        aria-label="Model"
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </label>
  );
}

