"use client";

import * as React from "react";
import { DEFAULT_MODEL, isModelId, normalizeModelIdString, type ModelId } from "./models";

const STORAGE_KEY = "ai-suite:model";

type ModelContextValue = {
  model: ModelId;
  setModel: (model: ModelId) => void;
};

const ModelContext = React.createContext<ModelContextValue | null>(null);

function getInitialModel(): ModelId {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_MODEL;
  const normalized = normalizeModelIdString(saved);
  if (normalized !== saved) {
    try {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // ignore
    }
  }
  return isModelId(normalized) ? normalized : DEFAULT_MODEL;
}

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [model, setModelState] = React.useState<ModelId>(() => getInitialModel());

  const setModel = React.useCallback((next: ModelId) => {
    setModelState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const value = React.useMemo<ModelContextValue>(
    () => ({ model, setModel }),
    [model, setModel]
  );

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export function useModel() {
  const ctx = React.useContext(ModelContext);
  if (!ctx) throw new Error("useModel must be used within ModelProvider");
  return ctx;
}

