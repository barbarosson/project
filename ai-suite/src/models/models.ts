export type ProviderId = "openai" | "anthropic" | "groq" | "deepseek" | "google";

export type ModelPricing = {
  inputPer1MTokensUSD: number;
  outputPer1MTokensUSD: number;
};

export type SalesPrice = {
  usd: number;
  /** Pack price tier for billing logic / pricing page ($1 / $1.49 / $1.99 per 10 credits). */
  label: "$1.00" | "$1.49" | "$1.99";
  /** Shown in AI model lists: approximate cost per credit (pack ÷ 10). */
  listLabel: string;
};

function formatPerCreditListLabel(packUsd: number): string {
  const per = packUsd / 10;
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
 * Three tiers ($1 / $1.49 / $1.99) match planned 10-credit packs on `/pricing`.
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
    return { usd: 1.99, label: "$1.99", listLabel: formatPerCreditListLabel(1.99) };
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
    return { usd: 1.0, label: "$1.00", listLabel: formatPerCreditListLabel(1.0) };
  }

  // Tier B (standard): everything else.
  return { usd: 1.49, label: "$1.49", listLabel: formatPerCreditListLabel(1.49) };
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

/** Customer-facing price band for a concrete model ($1 / $1.49 / $1.99 sales tiers). */
export type ModelSalesTier = "budget" | "standard" | "premium";

/** Subscription billing: fast/mini-style models burn 1 credit per generation; premium burns 25. */
export const GENERATION_CREDITS_FAST = 1;
export const GENERATION_CREDITS_PREMIUM = 25;

const PREMIUM_GENERATION_MODELS = new Set<ConcreteModelId>([
  "gpt-4o",
  "gpt-4.1",
  "o1",
  "claude-sonnet-4-6",
  "claude-opus-4-7",
  "llama-3.3-70b-versatile",
  "deepseek-v4-pro",
  "gemini-2.5-pro",
]);

export function generationCreditsForConcreteModel(model: ConcreteModelId): number {
  return PREMIUM_GENERATION_MODELS.has(model) ? GENERATION_CREDITS_PREMIUM : GENERATION_CREDITS_FAST;
}

/**
 * Credits for one generation (initial or alternate version), given resolved concrete model id.
 * Use after resolving `auto` to the tool/provider default.
 */
export function generationCreditsForResolvedModel(modelId: string): number {
  const mid = normalizeModelIdString(modelId);
  if (mid === "auto") return GENERATION_CREDITS_FAST;
  if (!isConcreteModelId(mid)) return GENERATION_CREDITS_FAST;
  return generationCreditsForConcreteModel(mid);
}

export function modelSalesTier(model: ConcreteModelId): ModelSalesTier {
  const usd = salesPriceForModel(model).usd;
  if (usd === 1) return "budget";
  if (usd === 1.49) return "standard";
  return "premium";
}

/** Pay-as-you-go 10-credit pack price (USD) per sales tier — matches `/pricing` packs. */
export const TEN_CREDIT_PACK_USD: Record<ModelSalesTier, number> = {
  budget: 1,
  standard: 1.49,
  premium: 1.99,
};

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

/** Unit $/credit implied by the tier’s 10-credit pack (pack price ÷ 10). */
export function unitUsdPerCreditFromTenPack(tier: ModelSalesTier): number {
  return TEN_CREDIT_PACK_USD[tier] / 10;
}

/** One line per tier: unit rate from 10-pack + pack price (no per-model “≈ …/credit”). */
export function tierTenPackSummary(tier: ModelSalesTier): string {
  const per = unitUsdPerCreditFromTenPack(tier);
  const pack = TEN_CREDIT_PACK_USD[tier];
  return `${TIER_DISPLAY_NAME[tier]}: ${formatMoneyUsd(per)}/credit · $${pack.toFixed(2)} / 10 credits`;
}

/** `<optgroup label>` text for the model dropdown (three tiers). */
export function modelTierOptgroupLabel(tier: ModelSalesTier): string {
  const per = unitUsdPerCreditFromTenPack(tier);
  const pack = TEN_CREDIT_PACK_USD[tier];
  return `${TIER_DISPLAY_NAME[tier]} · ${formatMoneyUsd(per)}/credit ($${pack.toFixed(2)} ÷ 10)`;
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

