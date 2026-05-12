"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

/** Language + theme controls for secondary pages (legal, pricing, etc.). */
export function SiteLocaleToolbar({ className }: { className?: string }) {
  return (
    <div className={cn("flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2", className)}>
      <LanguageSwitcher className="px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm" />
      <ModeToggle />
    </div>
  );
}
