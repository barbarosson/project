import type { ToolName } from "@/components/ai-suite/tools";
import type { Locale } from "@/i18n/dictionaries";

export function toolTitleKey(tool: ToolName) {
  return `tool.${tool}.title`;
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

export function toolTitleFromSeed(
  dicts: Record<Locale, Record<string, string>>,
  locale: Locale,
  tool: ToolName,
  fallback: string
) {
  const key = toolTitleKey(tool);
  const fromLocale = dicts[locale]?.[key];
  if (typeof fromLocale === "string") return fromLocale;
  const fromEn = dicts.en?.[key];
  if (typeof fromEn === "string") return fromEn;
  return fallback;
}

