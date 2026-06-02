import type { ModelPricing, ProviderId } from "@/models/models-types";

/**
 * Static model catalog — add new API ids here (one object per model).
 * Optional deploy-time overrides: `config/model-catalog.json`, `config/recommended-models.json`,
 * env `ISENDAI_MODEL_CATALOG_JSON` / `ISENDAI_EXTRA_MODELS_JSON`.
 */
export type CatalogModelEntry = {
  id: string;
  label: string;
  pricing: ModelPricing;
  provider: ProviderId;
};

export const BASE_MODEL_CATALOG: CatalogModelEntry[] = [
  {
    id: "auto",
    label: "Auto (recommended)",
    pricing: { inputPer1MTokensUSD: 0, outputPer1MTokensUSD: 0 },
    provider: "openai",
  },

  // OpenAI
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
  {
    id: "gpt-4.1",
    label: "OpenAI · GPT‑4.1",
    pricing: { inputPer1MTokensUSD: 2.0, outputPer1MTokensUSD: 8.0 },
    provider: "openai",
  },
  {
    id: "gpt-4.1-mini",
    label: "OpenAI · GPT‑4.1 mini",
    pricing: { inputPer1MTokensUSD: 0.4, outputPer1MTokensUSD: 1.6 },
    provider: "openai",
  },
  {
    id: "gpt-4.1-nano",
    label: "OpenAI · GPT‑4.1 nano",
    pricing: { inputPer1MTokensUSD: 0.1, outputPer1MTokensUSD: 0.4 },
    provider: "openai",
  },
  {
    id: "o1",
    label: "OpenAI · o1 (reasoning)",
    pricing: { inputPer1MTokensUSD: 15.0, outputPer1MTokensUSD: 60.0 },
    provider: "openai",
  },
  {
    id: "o1-mini",
    label: "OpenAI · o1 mini (reasoning)",
    pricing: { inputPer1MTokensUSD: 3.0, outputPer1MTokensUSD: 12.0 },
    provider: "openai",
  },
  {
    id: "o3-mini",
    label: "OpenAI · o3 mini (reasoning)",
    pricing: { inputPer1MTokensUSD: 1.1, outputPer1MTokensUSD: 4.4 },
    provider: "openai",
  },

  // Anthropic
  {
    id: "claude-haiku-4-5",
    label: "Anthropic · Claude Haiku 4.5",
    pricing: { inputPer1MTokensUSD: 0.8, outputPer1MTokensUSD: 4.0 },
    provider: "anthropic",
  },
  {
    id: "claude-sonnet-4-5",
    label: "Anthropic · Claude Sonnet 4.5",
    pricing: { inputPer1MTokensUSD: 3.0, outputPer1MTokensUSD: 15.0 },
    provider: "anthropic",
  },
  {
    id: "claude-sonnet-4-6",
    label: "Anthropic · Claude Sonnet 4.6",
    pricing: { inputPer1MTokensUSD: 3.0, outputPer1MTokensUSD: 15.0 },
    provider: "anthropic",
  },
  {
    id: "claude-opus-4-7",
    label: "Anthropic · Claude Opus 4.7",
    pricing: { inputPer1MTokensUSD: 15.0, outputPer1MTokensUSD: 75.0 },
    provider: "anthropic",
  },
  {
    id: "claude-opus-4-8",
    label: "Anthropic · Claude Opus 4.8",
    pricing: { inputPer1MTokensUSD: 15.0, outputPer1MTokensUSD: 75.0 },
    provider: "anthropic",
  },

  // Groq
  {
    id: "llama-3.1-8b-instant",
    label: "Groq · Llama 3.1 8B Instant",
    pricing: { inputPer1MTokensUSD: 0.05, outputPer1MTokensUSD: 0.08 },
    provider: "groq",
  },
  {
    id: "llama-3.3-70b-versatile",
    label: "Groq · Llama 3.3 70B Versatile",
    pricing: { inputPer1MTokensUSD: 0.59, outputPer1MTokensUSD: 0.79 },
    provider: "groq",
  },
  {
    id: "llama-3.2-3b-preview",
    label: "Groq · Llama 3.2 3B Preview",
    pricing: { inputPer1MTokensUSD: 0.06, outputPer1MTokensUSD: 0.06 },
    provider: "groq",
  },
  {
    id: "mixtral-8x7b-32768",
    label: "Groq · Mixtral 8x7B 32K",
    pricing: { inputPer1MTokensUSD: 0.24, outputPer1MTokensUSD: 0.24 },
    provider: "groq",
  },
  {
    id: "gemma2-9b-it",
    label: "Groq · Gemma 2 9B IT",
    pricing: { inputPer1MTokensUSD: 0.2, outputPer1MTokensUSD: 0.2 },
    provider: "groq",
  },

  // DeepSeek
  {
    id: "deepseek-chat",
    label: "DeepSeek · Chat (V3)",
    pricing: { inputPer1MTokensUSD: 0.27, outputPer1MTokensUSD: 1.1 },
    provider: "deepseek",
  },
  {
    id: "deepseek-reasoner",
    label: "DeepSeek · Reasoner (R1)",
    pricing: { inputPer1MTokensUSD: 0.55, outputPer1MTokensUSD: 2.19 },
    provider: "deepseek",
  },
  {
    id: "deepseek-v3",
    label: "DeepSeek · V3",
    pricing: { inputPer1MTokensUSD: 0.27, outputPer1MTokensUSD: 1.1 },
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
    pricing: { inputPer1MTokensUSD: 0.15, outputPer1MTokensUSD: 0.6 },
    provider: "google",
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Google · Gemini 2.5 Flash‑Lite",
    pricing: { inputPer1MTokensUSD: 0.075, outputPer1MTokensUSD: 0.3 },
    provider: "google",
  },
  {
    id: "gemini-2.5-pro",
    label: "Google · Gemini 2.5 Pro",
    pricing: { inputPer1MTokensUSD: 1.25, outputPer1MTokensUSD: 10.0 },
    provider: "google",
  },
  {
    id: "gemini-2.0-flash-001",
    label: "Google · Gemini 2.0 Flash (001)",
    pricing: { inputPer1MTokensUSD: 0.1, outputPer1MTokensUSD: 0.4 },
    provider: "google",
  },
  {
    id: "gemini-2.0-flash",
    label: "Google · Gemini 2.0 Flash",
    pricing: { inputPer1MTokensUSD: 0.1, outputPer1MTokensUSD: 0.4 },
    provider: "google",
  },
];
