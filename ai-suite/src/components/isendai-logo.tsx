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
      className={cn("inline-flex shrink-0 items-center gap-2 sm:gap-2.5", className)}
      role="img"
      aria-label="isendai"
    >
      <IsendaiLogoMark className={iconClassName} />

      {withWordmark ? (
        <span
          className={cn(
            "font-display relative inline-flex min-w-0 items-baseline gap-1.5 whitespace-nowrap font-black uppercase leading-none tracking-[0.04em]",
            wordmarkClassName
          )}
        >
          <span
            className={cn(
              "relative bg-gradient-to-r from-violet-950 via-indigo-950 to-slate-900",
              "bg-clip-text text-transparent",
              "drop-shadow-[0_1px_0_rgba(255,255,255,0.95)]",
              "after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px",
              "after:bg-gradient-to-r after:from-violet-500/70 after:via-fuchsia-500/50 after:to-indigo-500/60"
            )}
          >
            {wordPrefix}
          </span>
          {hasTerminalAI ? (
            <span
              className={cn(
                "inline-flex h-[1.28em] min-w-[1.28em] shrink-0 items-center justify-center rounded-md px-[0.34em]",
                "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700",
                "text-[0.82em] font-black tracking-[0.14em] text-white",
                "shadow-[0_2px_10px_rgba(109,40,217,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]",
                "ring-1 ring-violet-900/15"
              )}
            >
              AI
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
