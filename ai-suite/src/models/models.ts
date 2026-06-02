export type ProviderId = "openai" | "anthropic" | "groq" | "deepseek" | "google";

export type ModelPricing = {
  inputPer1MTokensUSD: number;
  outputPer1MTokensUSD: number;
};

export type SalesPrice = {
  usd: number;
  /** Pack price tier for billing logic / pricing page ($1→10 / $1.49→25 / $1.99→50 credits). */
  label: "$1.00" | "$1.49" | "$1.99";
};

/** Customer-facing price band for a concrete model ($1 / $1.49 / $1.99 sales tiers). */
export type ModelSalesTier = "budget" | "standard" | "premium";

/** Pay-as-you-go pack price (USD) per sales tier — matches `/pricing`. */
export const PAYGO_PACK_PRICE_USD: Record<ModelSalesTier, number> = {
  budget: 1,
  standard: 1.49,
  premium: 1.99,
};

/** Credits included in each pay-as-you-go pack tier. */
export const PAYGO_PACK_CREDITS: Record<ModelSalesTier, number> = {
  budget: 10,
  standard: 25,
  premium: 50,
};

export function estimateCostUSD(
  pricing: ModelPricing,
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

/**
 * Tool-based token estimate used for internal cost calculations.
 * We intentionally keep it simple and deterministic (no runtime tokenization).
 */
export function estimateTokensForTool(tool: string): { inputTokens: number; outputTokens: number } {
  // "coverletter-ai" tends to be longer (job post + resume).
  if (tool === "coverletter-ai") return { inputTokens: 2200, outputTokens: 700 };

  // Default small rewrite/generate tools.
  return { inputTokens: 800, outputTokens: 400 };
}

/**
 * Sales price is what we charge the user (not raw API cost).
 * Three tiers match pay-as-you-go packs on `/pricing`.
 */
export function salesPriceForModel(model: ModelId): SalesPrice {
  // Tier C (premium): best quality / biggest models / reasoning.
  if (
    model === "gpt-4o" ||
    model === "gpt-4.1" ||
    model === "o1" ||
    model === "claude-sonnet-4-6" ||
    model === "claude-opus-4-7" ||
    model === "claude-opus-4-8" ||
    model === "deepseek-v4-pro" ||
    model === "gemini-2.5-pro"
  ) {
    return { usd: 1.99, label: "$1.99" };
  }

  // Tier A (budget): very cheap providers/models for high-volume usage.
  if (
    model === "llama-3.1-8b-instant" ||
    model === "mixtral-8x7b-32768" ||
    model === "gemma2-9b-it" ||
    model === "deepseek-chat" ||
    model === "deepseek-reasoner" ||
    model === "deepseek-v4-flash" ||
    model === "gemini-2.5-flash-lite"
  ) {
    return { usd: 1.0, label: "$1.00" };
  }

  // Tier B (standard): everything else.
  return { usd: 1.49, label: "$1.49" };
}

export const MODELS = [
  // Auto: tool/provider routing (category-based) decides.
  {
    id: "auto",
    label: "Auto (recommended)",
    pricing: { inputPer1MTokensUSD: 0, outputPer1MTokensUSD: 0 },
    provider: "openai",
  },

  // OpenAI (active, commonly used IDs)
  {
    id: "gpt-4o-mini",
    label: "OpenAI · GPT‑4o mini",
    pricing: { inputPer1MTokensUSD: 0.15, outputPer1MTokensUSD: 0.6 },
    provider: "openai",
  },
  {
    id: "gpt-4o",
    label: "OpenAI · GPT‑4o",
    pricing: { inputPer1MTokensUSD: 2.5, outputPer1MTokensUSD: 10.0 },
    provider: "openai",
  },
  // OpenAI: additional active families (pricing varies; fill when known).
  {
    id: "gpt-4.1",
    label: "OpenAI · GPT‑4.1",
    pricing: { inputPer1MTokensUSD: 2.0, outputPer1MTokensUSD: 8.0 },
    provider: "openai",
  },
  {
    id: "gpt-4.1-mini",
    label: "OpenAI · GPT‑4.1 mini",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
    provider: "openai",
  },
  {
    id: "gpt-4.1-nano",
    label: "OpenAI · GPT‑4.1 nano",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
    provider: "openai",
  },
  {
    id: "o1",
    label: "OpenAI · o1 (reasoning)",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
    provider: "openai",
  },
  {
    id: "o1-mini",
    label: "OpenAI · o1 mini (reasoning)",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
    provider: "openai",
  },

  // Anthropic (active IDs — use aliases Anthropic documents, not deprecated -latest slugs)
  {
    id: "claude-haiku-4-5",
    label: "Anthropic · Claude Haiku 4.5",
    pricing: { inputPer1MTokensUSD: 0.8, outputPer1MTokensUSD: 4.0 },
    provider: "anthropic",
  },
  {
    id: "claude-sonnet-4-6",
    label: "Anthropic · Claude Sonnet 4.6",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
    provider: "anthropic",
  },
  {
    id: "claude-opus-4-7",
    label: "Anthropic · Claude Opus 4.7",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
    provider: "anthropic",
  },
  {
    id: "claude-opus-4-8",
    label: "Anthropic · Claude Opus 4.8",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
    provider: "anthropic",
  },

  // Groq (active IDs)
  {
    id: "llama-3.1-8b-instant",
    label: "Groq · Llama 3.1 8B Instant",
    pricing: { inputPer1MTokensUSD: 0.05, outputPer1MTokensUSD: 0.08 },
    provider: "groq",
  },
  {
    id: "llama-3.3-70b-versatile",
    label: "Groq · Llama 3.3 70B Versatile",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
    provider: "groq",
  },
  {
    id: "mixtral-8x7b-32768",
    label: "Groq · Mixtral 8x7B 32K",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
    provider: "groq",
  },
  {
    id: "gemma2-9b-it",
    label: "Groq · Gemma 2 9B IT",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
    provider: "groq",
  },

  // DeepSeek (active IDs)
  {
    id: "deepseek-chat",
    label: "DeepSeek · Chat (legacy)",
    pricing: { inputPer1MTokensUSD: 0.14, outputPer1MTokensUSD: 0.28 },
    provider: "deepseek",
  },
  {
    id: "deepseek-reasoner",
    label: "DeepSeek · Reasoner (legacy)",
    pricing: { inputPer1MTokensUSD: 0.14, outputPer1MTokensUSD: 0.28 },
    provider: "deepseek",
  },
  {
    id: "deepseek-v4-flash",
    label: "DeepSeek · V4 Flash",
    pricing: { inputPer1MTokensUSD: 0.14, outputPer1MTokensUSD: 0.28 },
    provider: "deepseek",
  },
  {
    id: "deepseek-v4-pro",
    label: "DeepSeek · V4 Pro",
    pricing: { inputPer1MTokensUSD: 0.435, outputPer1MTokensUSD: 0.87 },
    provider: "deepseek",
  },

  // Google (Gemini)
  {
    id: "gemini-2.5-flash",
    label: "Google · Gemini 2.5 Flash",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
    provider: "google",
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Google · Gemini 2.5 Flash‑Lite",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
    provider: "google",
  },
  {
    id: "gemini-2.5-pro",
    label: "Google · Gemini 2.5 Pro",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
    provider: "google",
  },
  {
    id: "gemini-2.0-flash-001",
    label: "Google · Gemini 2.0 Flash (001)",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
    provider: "google",
  },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  pricing: ModelPricing;
  provider: ProviderId;
}>;

export type CatalogModelId = (typeof MODELS)[number]["id"];
export type ConcreteModelId = Exclude<CatalogModelId, "auto">;

/** User-facing model picker (no provider slugs in the UI). */
export const USER_MODEL_TIER_IDS = ["fast-ai", "pro-ai", "genius-ai"] as const;
export type UserFacingModelId = (typeof USER_MODEL_TIER_IDS)[number];

export const USER_MODEL_TIERS: ReadonlyArray<{
  id: UserFacingModelId;
  concreteId: ConcreteModelId;
}> = [
  { id: "fast-ai", concreteId: "gpt-4o-mini" },
  { id: "pro-ai", concreteId: "claude-haiku-4-5" },
  { id: "genius-ai", concreteId: "claude-opus-4-8" },
];

export type ModelId = UserFacingModelId | CatalogModelId;

export const DEFAULT_MODEL: ModelId = "fast-ai";

/** Retired ids still stored in localStorage or sent by old clients → map to current MODELS ids. */
const LEGACY_MODEL_ALIASES: Partial<Record<string, ConcreteModelId>> = {
  "claude-3-5-haiku-latest": "claude-haiku-4-5",
};

export function normalizeModelIdString(raw: string): string {
  const mapped = LEGACY_MODEL_ALIASES[raw];
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

/** Strip provider prefix from catalog label for pricing copy (e.g. "OpenAI · GPT‑4o" → "GPT‑4o"). */
export function pricingCatalogDisplayName(catalogLabel: string): string {
  const sep = " · ";
  const idx = catalogLabel.indexOf(sep);
  return idx >= 0 ? catalogLabel.slice(idx + sep.length) : catalogLabel;
}

/** All catalog models grouped by Fast / Pro / Genius billing class (matches the tool model picker). */
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

/** Map UI / legacy stored model id → concrete endpoint used for generation and billing. */
export function resolveConcreteModelId(model: ModelId): ConcreteModelId {
  const tier = USER_MODEL_TIERS.find((t) => t.id === model);
  if (tier) return tier.concreteId;
  if (model === "auto") return "gpt-4o-mini";
  if (isConcreteModelId(model)) return model;
  return "gpt-4o-mini";
}

/** Normalize localStorage / API model field to a user-facing tier when possible. */
export function normalizeUserModelId(raw: string): ModelId {
  const n = normalizeModelIdString(raw);
  if (isUserFacingModelId(n)) return n;
  if (n === "auto") return "fast-ai";
  if (isConcreteModelId(n)) return userFacingModelFromConcrete(n);
  return DEFAULT_MODEL;
}

/** Legacy constants — billing scales by input length; see {@link creditsForGeneration}. */
export const GENERATION_CREDITS_FAST = 1;
export const GENERATION_CREDITS_PREMIUM = 25;

/** Prompt length is billed in multiples of this many characters (rounded up). */
export const CREDIT_BILL_CHAR_LENGTH = 100;

/** @deprecated Use {@link CREDIT_BILL_CHAR_LENGTH}. */
export const CREDIT_CHUNK_CHAR_LENGTH = 500;

const MAX_BILLABLE_INPUT_CHARS = 50_000;

/** Tenths charged per 100-character block (0.2 / 3 / 5 credits). */
const CREDIT_TENTHS_PER_BLOCK_ECONOMY = 2;
const CREDIT_TENTHS_PER_BLOCK_STANDARD = 30;
const CREDIT_TENTHS_PER_BLOCK_PREMIUM = 50;

/**
 * How many 100-character blocks the prompt spans (rounded up). Empty input still bills one block.
 */
export function billableBlocks100(inputCharLength: number): number {
  const n = Math.min(Math.max(inputCharLength, 0), MAX_BILLABLE_INPUT_CHARS);
  if (n === 0) return 1;
  return Math.ceil(n / CREDIT_BILL_CHAR_LENGTH);
}

/** @deprecated Use {@link billableBlocks100}. */
export function billableChunks500(inputCharLength: number): number {
  const n = Math.min(Math.max(inputCharLength, 0), MAX_BILLABLE_INPUT_CHARS);
  if (n === 0) return 1;
  return Math.ceil(n / CREDIT_CHUNK_CHAR_LENGTH);
}

/**
 * Credit charge for one generation, in **tenths** (divide by 10 for display credits).
 *
 * - **Economy** + GPT‑4o mini: 0.2 credits / 100 chars (2 tenths per block).
 * - **Standard**: 3 credits / 100 chars (30 tenths per block).
 * - **Premium**: 5 credits / 100 chars (50 tenths per block).
 */
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

/** @deprecated Prefer {@link creditsForGeneration}(model, inputLength). Uses ~1.5k chars as a rough estimate for UI fallbacks. */
export function generationCreditsForConcreteModel(model: ConcreteModelId): number {
  return creditsForGeneration(model, 1500);
}

/**
 * Credits for one generation when only the model id is known — assumes medium-length input (~1.5k chars).
 */
export function generationCreditsForResolvedModel(modelId: string): number {
  const mid = normalizeUserModelId(modelId);
  return creditsForGeneration(resolveConcreteModelId(mid), 1500);
}

export function modelSalesTier(model: ConcreteModelId): ModelSalesTier {
  const usd = salesPriceForModel(model).usd;
  if (usd === 1) return "budget";
  if (usd === 1.49) return "standard";
  return "premium";
}

/** @deprecated Use {@link PAYGO_PACK_PRICE_USD} */
export const TEN_CREDIT_PACK_USD = PAYGO_PACK_PRICE_USD;

function formatPackPriceUsd(amount: number): string {
  return amount % 1 === 0 ? `$${amount.toFixed(0)}` : `$${amount.toFixed(2)}`;
}

/** Pay-as-you-go pack line: credits + total price (no per-credit unit rate). */
export function paygoPackLabel(tier: ModelSalesTier): string {
  const creds = PAYGO_PACK_CREDITS[tier];
  const price = PAYGO_PACK_PRICE_USD[tier];
  return `${creds} credits · ${formatPackPriceUsd(price)}`;
}

/** @deprecated Use {@link paygoPackLabel} */
export function tierTenPackSummary(tier: ModelSalesTier): string {
  return paygoPackLabel(tier);
}

export function modelMeta(id: ConcreteModelId) {
  const found = MODELS.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown model id: ${id}`);
  return found;
}

export function defaultConcreteModelForProvider(provider: ProviderId): ConcreteModelId {
  switch (provider) {
    case "openai":
      return "gpt-4o-mini";
    case "anthropic":
      return "claude-haiku-4-5";
    case "groq":
      return "llama-3.1-8b-instant";
    case "deepseek":
      return "deepseek-chat";
    case "google":
      return "gemini-2.5-flash";
  }
}

