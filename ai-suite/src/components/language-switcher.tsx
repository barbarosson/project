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
        "inline-flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300",
        glassSurface,
        className
      )}
    >
      <Languages className="size-4 shrink-0 text-indigo-400" strokeWidth={1.5} />
      <select
        className={cn(
          "min-w-0 max-w-full flex-1 rounded-md border border-white/[0.12] bg-zinc-950/95 px-2 py-1 text-sm text-zinc-100 shadow-inner outline-none",
          "focus:ring-2 focus:ring-violet-500/35"
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

