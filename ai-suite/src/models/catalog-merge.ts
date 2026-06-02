import modelCatalogJson from "../../config/model-catalog.json";
import recommendedModelsJson from "../../config/recommended-models.json";

import { BASE_MODEL_CATALOG, type CatalogModelEntry } from "@/models/models-catalog-base";
import type { ProviderId } from "@/models/models-types";

export type UserFacingModelId = "fast-ai" | "pro-ai" | "genius-ai";

export type ModelCatalogConfig = {
  tierModels?: Partial<Record<UserFacingModelId, string>>;
  categoryProviders?: Partial<Record<string, ProviderId>>;
  legacyAliases?: Record<string, string>;
  providerDefaults?: Partial<Record<ProviderId, string>>;
  pricing?: Record<string, { inputPer1MTokensUSD: number; outputPer1MTokensUSD: number }>;
};

type ExtraModelJson = {
  id: string;
  label: string;
  provider: ProviderId;
  pricing?: { inputPer1MTokensUSD: number; outputPer1MTokensUSD: number };
};

function parseEnvJson<T>(raw: string | undefined): T | null {
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function dedupeCatalog(entries: CatalogModelEntry[]): CatalogModelEntry[] {
  const seen = new Set<string>();
  const out: CatalogModelEntry[] = [];
  for (const e of entries) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

export function loadModelCatalogConfig(): ModelCatalogConfig {
  const fromFile = modelCatalogJson as ModelCatalogConfig;
  const fromEnv = parseEnvJson<ModelCatalogConfig>(process.env.ISENDAI_MODEL_CATALOG_JSON);
  return {
    ...fromFile,
    ...(fromEnv ?? {}),
    tierModels: { ...fromFile.tierModels, ...fromEnv?.tierModels },
    categoryProviders: { ...fromFile.categoryProviders, ...fromEnv?.categoryProviders },
    legacyAliases: { ...fromFile.legacyAliases, ...fromEnv?.legacyAliases },
    providerDefaults: { ...fromFile.providerDefaults, ...fromEnv?.providerDefaults },
    pricing: { ...fromEnv?.pricing },
  };
}

export function buildMergedModelCatalog(): CatalogModelEntry[] {
  const config = loadModelCatalogConfig();
  const extrasFromFile = (recommendedModelsJson.models ?? []) as ExtraModelJson[];
  const extrasFromEnv =
    parseEnvJson<{ models?: ExtraModelJson[] }>(process.env.ISENDAI_EXTRA_MODELS_JSON)?.models ?? [];

  const merged = dedupeCatalog([
    ...BASE_MODEL_CATALOG,
    ...extrasFromFile.map((m) => ({
      id: m.id,
      label: m.label,
      provider: m.provider,
      pricing: m.pricing ?? { inputPer1MTokensUSD: 0, outputPer1MTokensUSD: 0 },
    })),
    ...extrasFromEnv.map((m) => ({
      id: m.id,
      label: m.label,
      provider: m.provider,
      pricing: m.pricing ?? { inputPer1MTokensUSD: 0, outputPer1MTokensUSD: 0 },
    })),
  ]);

  if (!config.pricing) return merged;

  return merged.map((m) => {
    const patch = config.pricing?.[m.id];
    if (!patch) return m;
    return {
      ...m,
      pricing: {
        inputPer1MTokensUSD: patch.inputPer1MTokensUSD,
        outputPer1MTokensUSD: patch.outputPer1MTokensUSD,
      },
    };
  });
}

export const MODEL_CATALOG_CONFIG = loadModelCatalogConfig();
