import type { ToolName } from "@/components/ai-suite/tools";
import type { Locale } from "@/i18n/dictionaries";
import { resolveToolDescription, resolveToolTitle } from "@/i18n/tool-copy-resolve";

export function toolTitleKey(tool: ToolName) {
  return `tool.${tool}.title`;
}

export function toolDescKey(tool: ToolName) {
  return `tool.${tool}.desc`;
}

export function toolTitle(
  t: (key: string) => string,
  tool: ToolName,
  fallback: string
): string {
  const key = toolTitleKey(tool);
  const resolved = t(key);
  // If translation is missing, t() returns key string.
  return resolved === key ? fallback : resolved;
}

export function toolDescription(
  t: (key: string) => string,
  tool: ToolName,
  fallback: string
): string {
  const key = toolDescKey(tool);
  const resolved = t(key);
  return resolved === key ? fallback : resolved;
}

/** Primary CTA verb phrase (before credit suffix); only tools with dict keys are localized. */
const TOOL_PRIMARY_ACTION_KEYS: Partial<Record<ToolName, string>> = {
  "corporate-whisperer": "tool.corp.button",
  "coverletter-ai": "tool.cover.button",
  "dating-roast": "tool.dating.button",
};

export function toolPrimaryActionLabel(
  t: (key: string) => string,
  tool: ToolName,
  fallback: string
): string {
  const key = TOOL_PRIMARY_ACTION_KEYS[tool];
  if (!key) return fallback;
  const resolved = t(key);
  return resolved === key ? fallback : resolved;
}

/** @deprecated Prefer resolveToolTitle from tool-copy-resolve; kept for compatibility. */
export function toolTitleFromSeed(_dicts: unknown, locale: Locale, tool: ToolName) {
  void _dicts;
  return resolveToolTitle(locale, tool);
}

/** @deprecated Prefer resolveToolDescription from tool-copy-resolve. */
export function toolDescFromSeed(_dicts: unknown, locale: Locale, tool: ToolName) {
  void _dicts;
  return resolveToolDescription(locale, tool);
}

