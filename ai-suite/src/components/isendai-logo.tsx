"use client";

import { IsendaiLogoMark } from "@/components/isendai-logo-mark";
import { cn } from "@/lib/utils";

export function IsendaiLogo({
  className,
  iconClassName,
  wordmarkClassName,
  withWordmark = false,
  wordmarkText = "ISENDAI",
}: {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  withWordmark?: boolean;
  wordmarkText?: string;
}) {
  const normalized = String(wordmarkText || "ISENDAI").trim();
  const upper = normalized.toUpperCase();
  const hasTerminalAI = upper.endsWith("AI") && upper.length > 2;
  const wordPrefix = hasTerminalAI ? normalized.slice(0, -2) : normalized;

  return (
    <div
      className={cn("inline-flex min-w-0 items-center gap-1.5 sm:gap-2", className)}
      role="img"
      aria-label="isendai"
    >
      <IsendaiLogoMark className={iconClassName} />

      {withWordmark ? (
        <span
          className={cn(
            "font-display min-w-0 whitespace-nowrap font-black uppercase leading-none tracking-tight",
            wordmarkClassName
          )}
        >
          <span
            className={cn(
              "bg-gradient-to-br from-[hsl(255_85%_65%)] via-[hsl(200_95%_55%)] to-[hsl(285_85%_65%)]",
              "bg-clip-text text-transparent",
              "[text-shadow:0_0_22px_hsl(255_85%_65%_/_0.15)]",
              "light:from-violet-800 light:via-indigo-800 light:to-fuchsia-800 light:[text-shadow:none]"
            )}
          >
            {wordPrefix}
          </span>
          {hasTerminalAI ? (
            <>
              <span className="inline-block w-[0.22em]" aria-hidden="true" />
              <span className="inline-flex items-center align-baseline">
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full",
                    "h-[1.35em] min-w-[1.35em] px-[0.38em]",
                    "text-[0.92em] font-black tracking-[0.08em]",
                    "border border-slate-900/20 bg-white text-slate-950",
                    "shadow-[0_0_20px_hsl(200_95%_55%_/_0.25)]",
                    "light:border-indigo-900/25 light:bg-indigo-950 light:text-white light:shadow-[0_0_16px_hsl(262_55%_45%_/_0.2)]"
                  )}
                >
                  AI
                </span>
              </span>
            </>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
