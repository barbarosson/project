import {
  buildMergedModelCatalog,
  MODEL_CATALOG_CONFIG,
  type UserFacingModelId,
} from "@/models/catalog-merge";
import type { CatalogModelEntry } from "@/models/models-catalog-base";

export type { ProviderId, ModelPricing } from "@/models/models-types";
export type { UserFacingModelId } from "@/models/catalog-merge";

export type SalesPrice = {
  usd: number;
  label: "$1.00" | "$1.49" | "$1.99";
};

export type ModelSalesTier = "budget" | "standard" | "premium";

export const PAYGO_PACK_PRICE_USD: Record<ModelSalesTier, number> = {
  budget: 1,
  standard: 1.49,
  premium: 1.99,
};

export const PAYGO_PACK_CREDITS: Record<ModelSalesTier, number> = {
  budget: 10,
  standard: 25,
  premium: 50,
};

export function estimateCostUSD(
  pricing: import("@/models/models-types").ModelPricing,
  {
    inputTokens,
    outputTokens,
  }: {
    inputTokens: number;
    outputTokens: number;
  }
): number {
  return (
    (pricing.inputPer1MTokensUSD * inputTokens) / 1_000_000 +
    (pricing.outputPer1MTokensUSD * outputTokens) / 1_000_000
  );
}

export function estimateTokensForTool(tool: string): { inputTokens: number; outputTokens: number } {
  if (tool === "coverletter-ai") return { inputTokens: 2200, outputTokens: 700 };
  return { inputTokens: 800, outputTokens: 400 };
}

export function salesPriceForModel(model: ModelId): SalesPrice {
  const id = resolveConcreteModelId(model as ModelId);
  if (
    id === "gpt-4o" ||
    id === "gpt-4.1" ||
    id === "o1" ||
    id === "o3-mini" ||
    id === "claude-sonnet-4-5" ||
    id === "claude-sonnet-4-6" ||
    id === "claude-opus-4-7" ||
    id === "claude-opus-4-8" ||
    id === "deepseek-reasoner" ||
    id === "deepseek-v4-pro" ||
    id === "gemini-2.5-pro"
  ) {
    return { usd: 1.99, label: "$1.99" };
  }

  if (
    id === "llama-3.1-8b-instant" ||
    id === "llama-3.2-3b-preview" ||
    id === "mixtral-8x7b-32768" ||
    id === "gemma2-9b-it" ||
    id === "deepseek-chat" ||
    id === "deepseek-v3" ||
    id === "deepseek-v4-flash" ||
    id === "gemini-2.5-flash-lite" ||
    id === "gemini-2.0-flash" ||
    id === "gemini-2.0-flash-001" ||
    id === "gpt-4.1-nano"
  ) {
    return { usd: 1.0, label: "$1.00" };
  }

  return { usd: 1.49, label: "$1.49" };
}

/** Merged static + JSON + env extras. */
export const MODELS: readonly CatalogModelEntry[] = buildMergedModelCatalog();

export type CatalogModelId = (typeof MODELS)[number]["id"];
export type ConcreteModelId = Exclude<CatalogModelId, "auto">;

export const USER_MODEL_TIER_IDS = ["fast-ai", "pro-ai", "genius-ai"] as const;

const DEFAULT_TIER_CONCRETE: Record<UserFacingModelId, ConcreteModelId> = {
  "fast-ai": "gpt-4o-mini",
  "pro-ai": "claude-sonnet-4-6",
  "genius-ai": "claude-opus-4-8",
};

function tierConcreteId(tier: UserFacingModelId): ConcreteModelId {
  const fromConfig = MODEL_CATALOG_CONFIG.tierModels?.[tier];
  if (fromConfig && isConcreteModelId(fromConfig)) return fromConfig;
  return DEFAULT_TIER_CONCRETE[tier];
}

export const USER_MODEL_TIERS: ReadonlyArray<{
  id: UserFacingModelId;
  concreteId: ConcreteModelId;
}> = USER_MODEL_TIER_IDS.map((id) => ({
  id,
  concreteId: tierConcreteId(id),
}));

export type ModelId = UserFacingModelId | CatalogModelId;

export const DEFAULT_MODEL: ModelId = "fast-ai";

export function normalizeModelIdString(raw: string): string {
  const aliases = MODEL_CATALOG_CONFIG.legacyAliases as Partial<Record<string, ConcreteModelId>>;
  const mapped = aliases?.[raw];
  return mapped ?? raw;
}

export function isUserFacingModelId(value: unknown): value is UserFacingModelId {
  return typeof value === "string" && USER_MODEL_TIER_IDS.includes(value as UserFacingModelId);
}

export function isModelId(value: unknown): value is ModelId {
  return isUserFacingModelId(value) || (typeof value === "string" && MODELS.some((m) => m.id === value));
}

export function isConcreteModelId(value: unknown): value is ConcreteModelId {
  return typeof value === "string" && value !== "auto" && MODELS.some((m) => m.id === value);
}

export function userFacingModelFromConcrete(concrete: ConcreteModelId): UserFacingModelId {
  if (concrete === "gpt-4o-mini" || modelSalesTier(concrete) === "budget") return "fast-ai";
  if (modelSalesTier(concrete) === "premium") return "genius-ai";
  return "pro-ai";
}

export function pricingCatalogDisplayName(catalogLabel: string): string {
  const sep = " · ";
  const idx = catalogLabel.indexOf(sep);
  return idx >= 0 ? catalogLabel.slice(idx + sep.length) : catalogLabel;
}

export function modelsGroupedByUserFacingTier(): Record<
  UserFacingModelId,
  ReadonlyArray<{ id: ConcreteModelId; name: string }>
> {
  const groups: Record<UserFacingModelId, { id: ConcreteModelId; name: string }[]> = {
    "fast-ai": [],
    "pro-ai": [],
    "genius-ai": [],
  };
  for (const m of MODELS) {
    if (m.id === "auto") continue;
    const id = m.id as ConcreteModelId;
    const tier = userFacingModelFromConcrete(id);
    groups[tier].push({ id, name: pricingCatalogDisplayName(m.label) });
  }
  for (const tier of USER_MODEL_TIER_IDS) {
    groups[tier].sort((a, b) => a.name.localeCompare(b.name, "en"));
  }
  return groups;
}

/** Picker: quick tiers + every catalog model grouped by provider. */
export function modelsPickerGroups(): ReadonlyArray<{
  provider: import("@/models/models-types").ProviderId;
  models: ReadonlyArray<{ id: ConcreteModelId; label: string }>;
}> {
  const byProvider = new Map<
    import("@/models/models-types").ProviderId,
    { id: ConcreteModelId; label: string }[]
  >();
  for (const m of MODELS) {
    if (m.id === "auto") continue;
    const list = byProvider.get(m.provider) ?? [];
    list.push({ id: m.id as ConcreteModelId, label: pricingCatalogDisplayName(m.label) });
    byProvider.set(m.provider, list);
  }
  const order: import("@/models/models-types").ProviderId[] = [
    "openai",
    "anthropic",
    "google",
    "groq",
    "deepseek",
  ];
  return order
    .filter((p) => byProvider.has(p))
    .map((provider) => ({
      provider,
      models: (byProvider.get(provider) ?? []).sort((a, b) => a.label.localeCompare(b.label, "en")),
    }));
}

export function resolveConcreteModelId(model: ModelId): ConcreteModelId {
  const tier = USER_MODEL_TIERS.find((t) => t.id === model);
  if (tier) return tier.concreteId;
  if (model === "auto") return defaultConcreteModelForProvider("openai");
  if (isConcreteModelId(model)) return model;
  return tierConcreteId("fast-ai");
}

/**
 * Parse client `model` field: preserves concrete catalog ids; maps legacy aliases; folds unknown to default tier.
 */
export function parseRequestedModelId(raw: string | undefined | null): ModelId {
  if (!raw?.trim()) return DEFAULT_MODEL;
  const n = normalizeModelIdString(raw.trim());
  if (isUserFacingModelId(n)) return n;
  if (n === "auto") return "auto";
  if (isConcreteModelId(n)) return n;
  return DEFAULT_MODEL;
}

/** Normalize stored preference — keeps explicit concrete model ids for the advanced picker. */
export function normalizeUserModelId(raw: string): ModelId {
  return parseRequestedModelId(raw);
}

/** Billing / UI tier hint when only a concrete id is stored. */
export function billingTierHintForModelId(model: ModelId): UserFacingModelId {
  if (isUserFacingModelId(model)) return model;
  if (isConcreteModelId(model)) return userFacingModelFromConcrete(model);
  return DEFAULT_MODEL as UserFacingModelId;
}

export const GENERATION_CREDITS_FAST = 1;
export const GENERATION_CREDITS_PREMIUM = 25;

export const CREDIT_BILL_CHAR_LENGTH = 100;
export const CREDIT_CHUNK_CHAR_LENGTH = 500;

const MAX_BILLABLE_INPUT_CHARS = 50_000;

const CREDIT_TENTHS_PER_BLOCK_ECONOMY = 2;
const CREDIT_TENTHS_PER_BLOCK_STANDARD = 30;
const CREDIT_TENTHS_PER_BLOCK_PREMIUM = 50;

export function billableBlocks100(inputCharLength: number): number {
  const n = Math.min(Math.max(inputCharLength, 0), MAX_BILLABLE_INPUT_CHARS);
  if (n === 0) return 1;
  return Math.ceil(n / CREDIT_BILL_CHAR_LENGTH);
}

export function billableChunks500(inputCharLength: number): number {
  const n = Math.min(Math.max(inputCharLength, 0), MAX_BILLABLE_INPUT_CHARS);
  if (n === 0) return 1;
  return Math.ceil(n / CREDIT_CHUNK_CHAR_LENGTH);
}

export function creditsForGeneration(model: ConcreteModelId, inputCharLength: number): number {
  const blocks = billableBlocks100(inputCharLength);
  if (model === "gpt-4o-mini" || modelSalesTier(model) === "budget") {
    return blocks * CREDIT_TENTHS_PER_BLOCK_ECONOMY;
  }
  if (modelSalesTier(model) === "premium") {
    return blocks * CREDIT_TENTHS_PER_BLOCK_PREMIUM;
  }
  return blocks * CREDIT_TENTHS_PER_BLOCK_STANDARD;
}

export function generationCreditsForConcreteModel(model: ConcreteModelId): number {
  return creditsForGeneration(model, 1500);
}

export function generationCreditsForResolvedModel(modelId: string): number {
  return creditsForGeneration(resolveConcreteModelId(parseRequestedModelId(modelId)), 1500);
}

export function modelSalesTier(model: ConcreteModelId): ModelSalesTier {
  const usd = salesPriceForModel(model).usd;
  if (usd === 1) return "budget";
  if (usd === 1.49) return "standard";
  return "premium";
}

export const TEN_CREDIT_PACK_USD = PAYGO_PACK_PRICE_USD;

function formatPackPriceUsd(amount: number): string {
  return amount % 1 === 0 ? `$${amount.toFixed(0)}` : `$${amount.toFixed(2)}`;
}

export function paygoPackLabel(tier: ModelSalesTier): string {
  const creds = PAYGO_PACK_CREDITS[tier];
  const price = PAYGO_PACK_PRICE_USD[tier];
  return `${creds} credits · ${formatPackPriceUsd(price)}`;
}

export function tierTenPackSummary(tier: ModelSalesTier): string {
  return paygoPackLabel(tier);
}

export function modelMeta(id: ConcreteModelId) {
  const found = MODELS.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown model id: ${id}`);
  return found;
}

const DEFAULT_PROVIDER_MODEL: Record<import("@/models/models-types").ProviderId, ConcreteModelId> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5",
  groq: "llama-3.3-70b-versatile",
  deepseek: "deepseek-v4-flash",
  google: "gemini-2.5-flash",
};

export function defaultConcreteModelForProvider(provider: import("@/models/models-types").ProviderId): ConcreteModelId {
  const fromConfig = MODEL_CATALOG_CONFIG.providerDefaults?.[provider];
  if (fromConfig && isConcreteModelId(fromConfig)) return fromConfig;
  return DEFAULT_PROVIDER_MODEL[provider];
}
