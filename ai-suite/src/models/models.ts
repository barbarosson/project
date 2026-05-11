export type ProviderId = "openai" | "anthropic" | "groq" | "deepseek" | "google";

export type ModelPricing = {
  inputPer1MTokensUSD: number;
  outputPer1MTokensUSD: number;
};

export type SalesPrice = {
  usd: number;
  label: "$1.00" | "$1.49" | "$1.99";
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
 * Currently we use two tiers to match Stripe pricing links.
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

  // Anthropic (active IDs)
  {
    id: "claude-3-5-haiku-latest",
    label: "Anthropic · Claude 3.5 Haiku (legacy id)",
    pricing: { inputPer1MTokensUSD: 0.8, outputPer1MTokensUSD: 4.0 },
    provider: "anthropic",
  },
  {
    id: "claude-haiku-4-5",
    label: "Anthropic · Claude Haiku 4.5",
    pricing: { inputPer1MTokensUSD: 0.0, outputPer1MTokensUSD: 0.0 },
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

export function isModelId(value: unknown): value is ModelId {
  return typeof value === "string" && MODELS.some((m) => m.id === value);
}

export function isConcreteModelId(value: unknown): value is ConcreteModelId {
  return typeof value === "string" && value !== "auto" && MODELS.some((m) => m.id === value);
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
      return "claude-3-5-haiku-latest";
    case "groq":
      return "llama-3.1-8b-instant";
    case "deepseek":
      return "deepseek-chat";
    case "google":
      return "gemini-2.5-flash";
  }
}

