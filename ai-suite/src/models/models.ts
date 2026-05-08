export type ModelId = "gpt-4o-mini" | "gpt-4.1-mini" | "gpt-4o";

export type ModelPricing = {
  inputPer1MTokensUSD: number;
  outputPer1MTokensUSD: number;
};

export const MODELS: {
  id: ModelId;
  label: string;
  pricing: ModelPricing;
}[] = [
  {
    id: "gpt-4o-mini",
    label: "OpenAI GPT‑4o mini (Fast & cheap)",
    pricing: { inputPer1MTokensUSD: 0.15, outputPer1MTokensUSD: 0.6 },
  },
  {
    id: "gpt-4.1-mini",
    label: "OpenAI GPT‑4.1 mini (Better writing)",
    pricing: { inputPer1MTokensUSD: 0.4, outputPer1MTokensUSD: 1.6 },
  },
  {
    id: "gpt-4o",
    label: "OpenAI GPT‑4o (Premium)",
    pricing: { inputPer1MTokensUSD: 2.5, outputPer1MTokensUSD: 10.0 },
  },
];

export const DEFAULT_MODEL: ModelId = "gpt-4o-mini";

export function isModelId(value: unknown): value is ModelId {
  return (
    value === "gpt-4o-mini" ||
    value === "gpt-4.1-mini" ||
    value === "gpt-4o"
  );
}

