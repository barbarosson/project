export type ProviderId = "openai" | "anthropic" | "groq" | "deepseek";

export type ConcreteModelId =
  | "gpt-4o-mini"
  | "gpt-4o"
  | "claude-3-5-haiku-latest"
  | "llama-3.1-8b-instant"
  | "deepseek-chat";

export type ModelId = "auto" | ConcreteModelId;

export type ModelPricing = {
  inputPer1MTokensUSD: number;
  outputPer1MTokensUSD: number;
};

export const MODELS: {
  id: ModelId;
  label: string;
  pricing: ModelPricing;
  provider: ProviderId;
}[] = [
  {
    id: "auto",
    label: "Auto (recommended: tool chooses best provider)",
    pricing: { inputPer1MTokensUSD: 0, outputPer1MTokensUSD: 0 },
    provider: "openai",
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o-mini (Fast & Cheap - $1.49)",
    pricing: { inputPer1MTokensUSD: 0.15, outputPer1MTokensUSD: 0.6 },
    provider: "openai",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o (Premium Reasoning - $2.49)",
    pricing: { inputPer1MTokensUSD: 2.5, outputPer1MTokensUSD: 10.0 },
    provider: "openai",
  },
  {
    id: "claude-3-5-haiku-latest",
    label: "Claude 3.5 Haiku (High EQ & Empathy - $1.49)",
    pricing: { inputPer1MTokensUSD: 0, outputPer1MTokensUSD: 0 },
    provider: "anthropic",
  },
  {
    id: "llama-3.1-8b-instant",
    label: "Groq Llama 3.1 8B Instant (Very fast)",
    pricing: { inputPer1MTokensUSD: 0, outputPer1MTokensUSD: 0 },
    provider: "groq",
  },
  {
    id: "deepseek-chat",
    label: "DeepSeek Chat (Balanced)",
    pricing: { inputPer1MTokensUSD: 0, outputPer1MTokensUSD: 0 },
    provider: "deepseek",
  },
];

export const DEFAULT_MODEL: ModelId = "auto";

export function isModelId(value: unknown): value is ModelId {
  if (value === "auto") return true;
  return (
    value === "gpt-4o-mini" ||
    value === "gpt-4o" ||
    value === "claude-3-5-haiku-latest" ||
    value === "llama-3.1-8b-instant" ||
    value === "deepseek-chat"
  );
}

export function isConcreteModelId(value: unknown): value is ConcreteModelId {
  return (
    value === "gpt-4o-mini" ||
    value === "gpt-4o" ||
    value === "claude-3-5-haiku-latest" ||
    value === "llama-3.1-8b-instant" ||
    value === "deepseek-chat"
  );
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
  }
}

