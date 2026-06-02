import { categoryProviderFor } from "@/lib/ai/category-provider";
import { CATEGORY_META, TOOLS_SEED, type ToolCategory, type ToolField } from "./tools-data";

export { CATEGORY_META };
export type { ToolCategory, ToolField };

export type ToolName = (typeof TOOLS_SEED)[number]["tool"];
export type ProviderId = "openai" | "anthropic" | "groq" | "deepseek" | "google";

export type ToolPayload =
  | { tool: "coverletter-ai"; jobLink: string; resume: string }
  | { tool: Exclude<ToolName, "coverletter-ai">; text: string }
  // Backwards compatible payloads (older deployed versions):
  | { tool: "dating-roast"; profile: string }
  | { tool: "corporate-whisperer"; text: string };

export type ToolDefinition = {
  tool: ToolName;
  category: ToolCategory;
  emoji: string;
  title: string;
  description: string;
  actionLabel: string;
  fields: ToolField[];
  storageKey: string;
  provider: ProviderId;
  model?: string;
  scopeHint: string;
  systemPrompt: string;
  /** Few-shot examples from feedback loop (optional; populated at runtime later). */
  dynamicExamples?: string[];
};

function mkStorageKey(tool: ToolName) {
  return `ai-suite:payload:${tool}`;
}

const TOOL_PROVIDER_OVERRIDES: Partial<Record<ToolName, ProviderId>> = {
  // Specific tool overrides (deterministic)
  "perfect-apology": "anthropic",
  "dating-roast": "groq",
  "passive-aggressive-decoder": "groq",
};

function inferProvider(seed: (typeof TOOLS_SEED)[number]): ProviderId {
  const tool = seed.tool as ToolName;
  return TOOL_PROVIDER_OVERRIDES[tool] ?? categoryProviderFor(seed.category);
}

export const TOOLS: ToolDefinition[] = TOOLS_SEED.map((t) => ({
  tool: t.tool as ToolName,
  category: t.category,
  emoji: t.emoji,
  title: t.title,
  description: t.description,
  actionLabel: t.actionLabel,
  fields: t.fields,
  storageKey: mkStorageKey(t.tool as ToolName),
  provider: inferProvider(t),
  model: t.model,
  scopeHint: t.scopeHint,
  systemPrompt: t.systemPrompt,
  dynamicExamples: t.dynamicExamples,
}));

export function getToolDefinition(tool: ToolName): ToolDefinition {
  const found = TOOLS.find((t) => t.tool === tool);
  if (!found) throw new Error(`Unknown tool: ${tool}`);
  return found;
}

export function isToolName(value: string | null | undefined): value is ToolName {
  if (value == null || value === "") return false;
  return TOOLS.some((t) => t.tool === value);
}
