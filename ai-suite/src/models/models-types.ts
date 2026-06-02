export type ProviderId = "openai" | "anthropic" | "groq" | "deepseek" | "google";

export type ModelPricing = {
  inputPer1MTokensUSD: number;
  outputPer1MTokensUSD: number;
};
