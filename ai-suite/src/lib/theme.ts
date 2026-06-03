export type Theme = "light" | "dark";

export const THEME_COOKIE = "ai-suite-theme";
export const THEME_STORAGE_KEY = "ai-suite:theme";

export function isTheme(value: string | undefined | null): value is Theme {
  return value === "light" || value === "dark";
}

export function resolveThemeFromCookie(cookieValue: string | undefined): Theme {
  return isTheme(cookieValue) ? cookieValue : "dark";
}
