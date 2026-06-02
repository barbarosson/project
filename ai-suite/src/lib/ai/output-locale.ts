import type { Locale } from "@/i18n/dictionaries";

const LOCALE_LANGUAGE_LABEL: Record<Locale, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  zh: "Chinese (Simplified)",
  tr: "Turkish",
};

/**
 * Hard requirement so models do not reply in English when the user wrote in another language.
 */
export function outputLanguageDirective(locale: Locale, userText?: string): string {
  const uiLanguage = LOCALE_LANGUAGE_LABEL[locale] ?? "English";
  const hasUserText = typeof userText === "string" && userText.trim().length > 0;

  return [
    "OUTPUT LANGUAGE (mandatory — never ignore):",
    "- Write the **entire** deliverable in the **same natural language as the user's input** (subject, headings, bullets, body).",
    `- If the input language is mixed or unclear, default to **${uiLanguage}** (the user's UI locale).`,
    "- Do **not** reply in English unless the user's input is clearly in English.",
    "- Do **not** explain your role or refuse in a different language than the deliverable.",
    hasUserText
      ? "- Detect language from the user message below; match it exactly (including Turkish, German, etc.)."
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
