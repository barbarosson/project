"use client";

import * as React from "react";
import { Languages } from "lucide-react";

import { LOCALES, type Locale } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm",
        className
      )}
    >
      <Languages className="size-4 text-muted-foreground" />
      <select
        className="bg-transparent outline-none"
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

