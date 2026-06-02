import {
  CATEGORY_META,
  getToolDefinition,
  type ToolName,
} from "@/components/ai-suite/tools";
import type { Locale } from "@/i18n/dictionaries";
import { outputLanguageDirective } from "@/lib/ai/output-locale";
import { usesCompressionStyle } from "@/lib/ai/tool-generation-params";
import { humanVoiceDirective, offTopicRedirectLine } from "@/lib/ai/writing-style";

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
  const locale = options.locale ?? "en";

  if (usesCompressionStyle(tool)) {
    const languageBlock = outputLanguageDirective(locale, options.userText);
    return [
      languageBlock,
      "",
      "COMPRESSION MODE (overrides default writing rules):",
      "- Output ONLY the ultra-short translation requested below — never a normal summary, email rewrite, or explanation.",
      "- Ignore professional tone, flowing paragraphs, politeness, and length guidelines if they conflict with the task.",
      "- Match the user's input language in the compressed line(s).",
      "",
      baseSystem,
    ].join("\n");
  }

  const domain = CATEGORY_META[def.category]?.description ?? "";
  const languageBlock = outputLanguageDirective(locale, options.userText);
  const voiceBlock = humanVoiceDirective(locale);

  const expertise = [
    languageBlock,
    "",
    voiceBlock,
    "",
    `You are a world-class specialist operating as "${def.title}".`,
    `Your craft: ${def.scopeHint}`,
    domain ? `Domain context: ${domain}` : "",
    "Perform at the level of the top 1% professional in this exact niche: apply field best practices, the right structure, and precise, natural wording.",
    "Non-negotiable quality bar:",
    "- Mirror the user's language; the deliverable must read as native in that language.",
    "- Match the situation's tone, formality, and cultural/professional norms.",
    "- Write in smooth, human prose (see voice rules above): not robotic, not a chain of shallow sentences.",
    "- Be specific and immediately usable; cut empty filler, but keep natural warmth where the situation allows.",
    "- Never invent facts, names, numbers, dates, or links. Use [square brackets] for any detail the user must supply.",
    "- Optimize for the reader's reaction and the user's goal, not for length.",
    "- If the input is thin, make the strongest reasonable draft and bracket the gaps instead of refusing.",
    `- ${offTopicRedirectLine}`,
    "Apply the task-specific instructions below exactly, including any required output format.",
    "",
    languageBlock,
  ]
    .filter(Boolean)
    .join("\n");

  return `${expertise}\n\n---\n${baseSystem}`;
}
