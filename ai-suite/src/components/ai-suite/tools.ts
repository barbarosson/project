import { CATEGORY_META, TOOLS_SEED, type ToolCategory, type ToolField } from "./tools-data";

export { CATEGORY_META };
export type { ToolCategory, ToolField };

export type ToolName = (typeof TOOLS_SEED)[number]["tool"];

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
  stripeEnvVar: string;
  provider?: "openai" | "anthropic";
  model?: string;
  scopeHint: string;
  systemPrompt: string;
};

function mkStorageKey(tool: ToolName) {
  return `ai-suite:payload:${tool}`;
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
  stripeEnvVar: t.stripeEnvVar,
  provider: t.provider,
  model: t.model,
  scopeHint: t.scopeHint,
  systemPrompt: t.systemPrompt,
}));

export function getToolDefinition(tool: ToolName): ToolDefinition {
  const found = TOOLS.find((t) => t.tool === tool);
  if (!found) throw new Error(`Unknown tool: ${tool}`);
  return found;
}

export function getStripeLink(tool: ToolName): string | null {
  const def = getToolDefinition(tool);
  const value = process.env[def.stripeEnvVar];
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function getStripeLinkForModel(tool: ToolName, model: string): string | null {
  // Default/back-compat: if model-specific env is missing, fall back to tool env var.
  const suffix = model.toUpperCase().replaceAll("-", "_").replaceAll(".", "_");
  const modelEnv = `NEXT_PUBLIC_STRIPE_LINK_${tool
    .toUpperCase()
    .replaceAll("-", "_")}_${suffix}`;
  const specific = process.env[modelEnv];
  if (specific && specific.trim().length > 0) return specific.trim();
  return getStripeLink(tool);
}

