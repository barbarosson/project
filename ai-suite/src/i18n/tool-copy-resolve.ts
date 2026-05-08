import { getToolDefinition, type ToolName } from "@/components/ai-suite/tools";
import { DICTS, type Locale } from "@/i18n/dictionaries";
import { TOOL_TRANSLATIONS } from "@/i18n/generated/tool-translations";

/** Auto-translate APIs sometimes return quota/error text as the "title". */
export function isBadAutoTranslation(s: string | undefined): boolean {
  if (s == null || s.trim().length === 0) return true;
  return /MYMEMORY|USAGE LIMIT|TRANSLATE MORE|USAGELIMITS/i.test(s);
}

export function resolveToolTitle(locale: Locale, tool: ToolName): string {
  const dictKey = `tool.${tool}.title`;
  const fromDict = DICTS[locale]?.[dictKey];
  if (fromDict && !isBadAutoTranslation(fromDict)) return fromDict;

  if (locale !== "en") {
    const pack = TOOL_TRANSLATIONS[locale]?.[tool];
    if (pack?.title && !isBadAutoTranslation(pack.title)) return pack.title;
  }

  const fromEnDict = DICTS.en?.[dictKey];
  if (fromEnDict && !isBadAutoTranslation(fromEnDict)) return fromEnDict;

  return getToolDefinition(tool).title;
}

export function resolveToolDescription(locale: Locale, tool: ToolName): string {
  const dictKey = `tool.${tool}.desc`;
  const fromDict = DICTS[locale]?.[dictKey];
  if (fromDict && !isBadAutoTranslation(fromDict)) return fromDict;

  if (locale !== "en") {
    const pack = TOOL_TRANSLATIONS[locale]?.[tool];
    if (pack?.description && !isBadAutoTranslation(pack.description)) {
      return pack.description;
    }
  }

  const fromEnDict = DICTS.en?.[dictKey];
  if (fromEnDict && !isBadAutoTranslation(fromEnDict)) return fromEnDict;

  return getToolDefinition(tool).description;
}
