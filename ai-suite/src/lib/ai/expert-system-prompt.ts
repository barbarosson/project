import {
  CATEGORY_META,
  getToolDefinition,
  type ToolName,
} from "@/components/ai-suite/tools";
import type { Locale } from "@/i18n/dictionaries";
import { outputLanguageDirective } from "@/lib/ai/output-locale";

export type ExpertPromptOptions = {
  locale?: Locale;
  /** Raw user input — strengthens language detection. */
  userText?: string;
};

/**
 * Wraps a tool's task-specific system prompt with a shared "domain expert" framing
 * so every tool behaves like a top-tier specialist in its exact niche — without
 * hand-editing each prompt. The task-specific prompt stays authoritative for the
 * output format; this only raises the quality bar and persona.
 */
export function buildExpertSystemPrompt(
  tool: ToolName,
  baseSystem: string,
  options: ExpertPromptOptions = {}
): string {
  const def = getToolDefinition(tool);
  const domain = CATEGORY_META[def.category]?.description ?? "";
  const locale = options.locale ?? "en";
  const languageBlock = outputLanguageDirective(locale, options.userText);

  const expertise = [
    languageBlock,
    "",
    `You are a world-class specialist operating as "${def.title}".`,
    `Your craft: ${def.scopeHint}`,
    domain ? `Domain context: ${domain}` : "",
    "Perform at the level of the top 1% professional in this exact niche: apply field best practices, the right structure, and precise, natural wording.",
    "Non-negotiable quality bar:",
    "- Mirror the user's language; the deliverable must read as native in that language.",
    "- Match the situation's tone, formality, and cultural/professional norms.",
    "- Be specific and immediately usable; remove filler, clichés, and generic phrasing.",
    "- Never invent facts, names, numbers, dates, or links. Use [square brackets] for any detail the user must supply.",
    "- Optimize for the reader's reaction and the user's goal, not for length.",
    "- If the input is thin, make the strongest reasonable draft and bracket the gaps instead of refusing.",
    "Apply the task-specific instructions below exactly, including any required output format.",
    "",
    languageBlock,
  ]
    .filter(Boolean)
    .join("\n");

  return `${expertise}\n\n---\n${baseSystem}`;
}
