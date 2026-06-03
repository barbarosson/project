"use client";

import * as React from "react";
import { Languages } from "lucide-react";

import { LOCALES, type Locale } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import { glassSurface } from "@/lib/premium-ui";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <label
      className={cn(
        "inline-flex min-w-0 max-w-[9.5rem] items-center gap-1 rounded-xl px-1.5 py-1.5 text-xs text-slate-300 sm:max-w-[11rem] sm:gap-1.5 sm:px-2 sm:py-2 sm:text-sm",
        glassSurface,
        "light:text-slate-700",
        className
      )}
    >
      <Languages className="size-3.5 shrink-0 text-indigo-400 sm:size-4 light:text-indigo-700" strokeWidth={1.5} />
      <select
        className={cn(
          "min-w-0 max-w-full flex-1 rounded-md border border-white/[0.12] bg-zinc-950/95 px-1 py-0.5 text-xs text-zinc-100 shadow-inner outline-none sm:px-1.5 sm:py-1 sm:text-sm",
          "focus:ring-2 focus:ring-violet-500/35",
          "light:border-slate-300/80 light:bg-white light:text-slate-900"
        )}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label="Language"
      >
        {LOCALES.map((l) => (
          <option key={l.locale} value={l.locale}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}

