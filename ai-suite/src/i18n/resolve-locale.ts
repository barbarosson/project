import type { Locale } from "@/i18n/dictionaries";

export function resolveLocaleFromCookie(cookieValue: string | undefined): Locale {
  if (
    cookieValue === "en" ||
    cookieValue === "tr" ||
    cookieValue === "es" ||
    cookieValue === "fr" ||
    cookieValue === "de" ||
    cookieValue === "zh"
  ) {
    return cookieValue;
  }
  return "en";
}
