"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TOOLS, type ToolName } from "@/components/ai-suite/tools";
import { DICTS, type Locale } from "./dictionaries";
import { resolveToolDescription, resolveToolTitle } from "./tool-copy-resolve";

const STORAGE_KEY = "ai-suite:locale";
const LOCALE_COOKIE = "ai-suite-locale";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

function readCookieLocale(): Locale | null {
  try {
    if (typeof document === "undefined") return null;
    const match = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("ai-suite-locale="));
    if (!match) return null;
    const value = decodeURIComponent(match.split("=").slice(1).join("="));
    return (value as Locale) in DICTS ? (value as Locale) : null;
  } catch {
    return null;
  }
}

function resolveClientLocalePreference(): Locale {
  const cookie = readCookieLocale();
  if (cookie) return cookie;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && DICTS[saved]) return saved;
  } catch {
    // ignore
  }
  const lang = (navigator.language || "en").toLowerCase();
  if (lang.startsWith("tr")) return "tr";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("de")) return "de";
  if (lang.startsWith("zh")) return "zh";
  return "en";
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const serverLocale = initialLocale ?? "en";
  const [locale, setLocaleState] = React.useState<Locale>(serverLocale);

  React.useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  React.useEffect(() => {
    const preferred = resolveClientLocalePreference();
    if (preferred !== serverLocale) {
      setLocaleState(preferred);
    }
    const cookieLocale = readCookieLocale();
    if (cookieLocale !== preferred) {
      try {
        document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(preferred)}; path=/; max-age=31536000; samesite=lax`;
      } catch {
        // ignore
      }
      void router.refresh();
    }
  }, [serverLocale, router]);

  const setLocale = React.useCallback(
    (next: Locale) => {
      setLocaleState(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      try {
        document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=31536000; samesite=lax`;
      } catch {
        // ignore
      }
      document.documentElement.lang = next;
      router.refresh();
    },
    [router]
  );

  const t = React.useCallback(
    (key: string) => {
      const m = /^tool\.(.+)\.(title|desc)$/.exec(key);
      if (m) {
        const id = m[1];
        const part = m[2];
        if (TOOLS.some((x) => x.tool === id)) {
          const tool = id as ToolName;
          return part === "title"
            ? resolveToolTitle(locale, tool)
            : resolveToolDescription(locale, tool);
        }
      }
      return DICTS[locale][key] ?? DICTS.en[key] ?? key;
    },
    [locale]
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

