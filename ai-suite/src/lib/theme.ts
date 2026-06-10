export type Theme = "light";

export const THEME_COOKIE = "ai-suite-theme";
export const THEME_STORAGE_KEY = "ai-suite:theme";

export function resolveThemeFromCookie(_cookieValue?: string | undefined): Theme {
  return "light";
}
