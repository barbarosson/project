"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";

/** Language controls for secondary pages (legal, pricing, etc.). */
export function SiteLocaleToolbar({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2", className)}>
      <LanguageSwitcher
        className={cn(
          "px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm",
          compact && "max-w-[4.75rem] gap-0.5 px-1 py-1 [&_select]:px-0.5 [&_select]:text-[11px]"
        )}
      />
    </div>
  );
}
