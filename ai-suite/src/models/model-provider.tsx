"use client";

import * as React from "react";
import {
  DEFAULT_MODEL,
  isModelId,
  normalizeUserModelId,
  type ModelId,
} from "./models";

const STORAGE_KEY = "ai-suite:model";

type ModelContextValue = {
  model: ModelId;
  setModel: (model: ModelId) => void;
  /** From membership profile (`user_metadata.default_ai_model`). */
  profileDefaultModel: UserFacingModelId;
};

const ModelContext = React.createContext<ModelContextValue | null>(null);

function readLocalStorageModel(): ModelId | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const normalized = normalizeUserModelId(saved);
    if (normalized !== saved) {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    }
    return isModelId(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

export function ModelProvider({
  children,
  initialDefaultAiModel = null,
}: {
  children: React.ReactNode;
  /** Server-hydrated membership default (signed-in users). */
  initialDefaultAiModel?: ModelId | null;
}) {
  const profileDefaultModel = initialDefaultAiModel ?? DEFAULT_MODEL;

  const [model, setModelState] = React.useState<ModelId>(() => {
    if (typeof window === "undefined") return profileDefaultModel;
    const stored = readLocalStorageModel();
    return stored ?? profileDefaultModel;
  });

  const setModel = React.useCallback((next: ModelId) => {
    setModelState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const value = React.useMemo<ModelContextValue>(
    () => ({ model, setModel, profileDefaultModel }),
    [model, setModel, profileDefaultModel]
  );

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export function useModel() {
  const ctx = React.useContext(ModelContext);
  if (!ctx) throw new Error("useModel must be used within ModelProvider");
  return ctx;
}
