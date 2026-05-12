export type ProviderId = "openai" | "anthropic" | "groq" | "deepseek" | "google";

export type ModelPricing = {
  inputPer1MTokensUSD: number;
  outputPer1MTokensUSD: number;
};

export type SalesPrice = {
  usd: number;
  /** Pack price tier for billing logic / pricing page ($1→10 / $1.49→25 / $1.99→50 credits). */
  label: "$1.00" | "$1.49" | "$1.99";
  /** Shown in AI model lists: approximate cost per credit (pack price ÷ credits in pack). */
  listLabel: string;
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

function formatPerCreditListLabelForTier(tier: ModelSalesTier): string {
  const per = PAYGO_PACK_PRICE_USD[tier] / PAYGO_PACK_CREDITS[tier];
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(per);
  return `≈ ${fmt}/credit`;
}

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
    model === "deepseek-v4-pro" ||
    model === "gemini-2.5-pro"
  ) {
    return { usd: 1.99, label: "$1.99", listLabel: formatPerCreditListLabelForTier("premium") };
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
    return { usd: 1.0, label: "$1.00", listLabel: formatPerCreditListLabelForTier("budget") };
  }

  // Tier B (standard): everything else.
  return { usd: 1.49, label: "$1.49", listLabel: formatPerCreditListLabelForTier("standard") };
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

export type ModelId = (typeof MODELS)[number]["id"];
export type ConcreteModelId = Exclude<ModelId, "auto">;

export const DEFAULT_MODEL: ModelId = "auto";

/** Retired ids still stored in localStorage or sent by old clients → map to current MODELS ids. */
const LEGACY_MODEL_ALIASES: Partial<Record<string, ConcreteModelId>> = {
  "claude-3-5-haiku-latest": "claude-haiku-4-5",
};

export function normalizeModelIdString(raw: string): string {
  const mapped = LEGACY_MODEL_ALIASES[raw];
  return mapped ?? raw;
}

export function isModelId(value: unknown): value is ModelId {
  return typeof value === "string" && MODELS.some((m) => m.id === value);
}

export function isConcreteModelId(value: unknown): value is ConcreteModelId {
  return typeof value === "string" && value !== "auto" && MODELS.some((m) => m.id === value);
}

/** Legacy constants — billing scales by input length; see {@link creditsForGeneration}. */
export const GENERATION_CREDITS_FAST = 1;
export const GENERATION_CREDITS_PREMIUM = 25;

/** Prompt length is billed in multiples of this many characters (rounded up). */
export const CREDIT_CHUNK_CHAR_LENGTH = 500;

const CREDITS_PER_CHUNK_ECONOMY = 1;
const CREDITS_PER_CHUNK_STANDARD = 15;
const CREDITS_PER_CHUNK_PREMIUM = 25;

const MAX_BILLABLE_INPUT_CHARS = 50_000;

/**
 * How many 500-character chunks the prompt spans (rounded up). Empty input still bills one chunk.
 */
export function billableChunks500(inputCharLength: number): number {
  const n = Math.min(Math.max(inputCharLength, 0), MAX_BILLABLE_INPUT_CHARS);
  if (n === 0) return 1;
  return Math.ceil(n / CREDIT_CHUNK_CHAR_LENGTH);
}

/**
 * Credits for one generation from pasted prompt length (characters we send).
 *
 * - **Economy** (`salesPriceForModel` → budget) **and GPT‑4o mini**: `chunks × 1` (1 credit per 500 chars).
 * **GPT‑4o mini** uses economy pricing even though its pack tier is standard.
 * - **Standard**: `chunks × 15`.
 * - **Premium**: `chunks × 25`.
 *
 * `chunks = ceil(characters / 500)`, capped at 50k chars → max 100 chunks.
 */
export function creditsForGeneration(model: ConcreteModelId, inputCharLength: number): number {
  const chunks = billableChunks500(inputCharLength);
  if (model === "gpt-4o-mini" || modelSalesTier(model) === "budget") {
    return chunks * CREDITS_PER_CHUNK_ECONOMY;
  }
  if (modelSalesTier(model) === "premium") {
    return chunks * CREDITS_PER_CHUNK_PREMIUM;
  }
  return chunks * CREDITS_PER_CHUNK_STANDARD;
}

/** @deprecated Prefer {@link creditsForGeneration}(model, inputLength). Uses ~1.5k chars as a rough estimate for UI fallbacks. */
export function generationCreditsForConcreteModel(model: ConcreteModelId): number {
  return creditsForGeneration(model, 1500);
}

/**
 * Credits for one generation when only the model id is known — assumes medium-length input (~1.5k chars).
 */
export function generationCreditsForResolvedModel(modelId: string): number {
  const mid = normalizeModelIdString(modelId);
  if (mid === "auto") return creditsForGeneration("gpt-4o-mini", 1500);
  if (!isConcreteModelId(mid)) return creditsForGeneration("gpt-4o-mini", 1500);
  return creditsForGeneration(mid, 1500);
}

export function modelSalesTier(model: ConcreteModelId): ModelSalesTier {
  const usd = salesPriceForModel(model).usd;
  if (usd === 1) return "budget";
  if (usd === 1.49) return "standard";
  return "premium";
}

/** @deprecated Use {@link PAYGO_PACK_PRICE_USD} */
export const TEN_CREDIT_PACK_USD = PAYGO_PACK_PRICE_USD;

const TIER_DISPLAY_NAME: Record<ModelSalesTier, string> = {
  budget: "Economy",
  standard: "Standard",
  premium: "Premium",
};

function formatMoneyUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(amount);
}

/** Unit $/credit implied by the tier’s pay-as-you-go pack (pack price ÷ credits in pack). */
export function unitUsdPerCreditFromPack(tier: ModelSalesTier): number {
  return PAYGO_PACK_PRICE_USD[tier] / PAYGO_PACK_CREDITS[tier];
}

/** @deprecated Use {@link unitUsdPerCreditFromPack} */
export function unitUsdPerCreditFromTenPack(tier: ModelSalesTier): number {
  return unitUsdPerCreditFromPack(tier);
}

/** One line per tier: unit rate + pack price + credits included. */
export function tierTenPackSummary(tier: ModelSalesTier): string {
  const per = unitUsdPerCreditFromPack(tier);
  const price = PAYGO_PACK_PRICE_USD[tier];
  const creds = PAYGO_PACK_CREDITS[tier];
  return `${TIER_DISPLAY_NAME[tier]}: ${formatMoneyUsd(per)}/credit · $${price.toFixed(2)} / ${creds} credits`;
}

/** `<optgroup label>` text for the model dropdown (three tiers). */
export function modelTierOptgroupLabel(tier: ModelSalesTier): string {
  const per = unitUsdPerCreditFromPack(tier);
  const price = PAYGO_PACK_PRICE_USD[tier];
  const creds = PAYGO_PACK_CREDITS[tier];
  return `${TIER_DISPLAY_NAME[tier]} · ${formatMoneyUsd(per)}/credit ($${price.toFixed(2)} → ${creds} credits)`;
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

