"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme, useThemeStorageSync } from "@/components/theme-provider";
import { useI18n } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

const btnClass =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-white/[0.18] bg-white/[0.08] p-2 text-slate-100 shadow-sm backdrop-blur-xl transition-colors hover:border-violet-500/35 hover:bg-white/[0.12] hover:text-white light:border-slate-400/55 light:bg-white light:text-slate-800 light:shadow-md light:hover:border-fuchsia-400/50 light:hover:bg-white light:hover:text-slate-900";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  useThemeStorageSync();
  const { t } = useI18n();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={cn(btnClass, className)}
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      title={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
    >
      {isDark ? (
        <Sun className="size-4 sm:size-[1.125rem]" aria-hidden />
      ) : (
        <Moon className="size-4 sm:size-[1.125rem]" aria-hidden />
      )}
    </button>
  );
}
