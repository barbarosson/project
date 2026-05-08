"use client";

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
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 64 64"
        className={cn("size-8", iconClassName)}
        role="img"
        aria-label="isendai"
      >
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="hsl(255 85% 65%)" />
            <stop offset="0.55" stopColor="hsl(200 95% 55%)" />
            <stop offset="1" stopColor="hsl(285 85% 65%)" />
          </linearGradient>
          <radialGradient id="g2" cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="hsl(255 85% 65% / 0.6)" />
            <stop offset="1" stopColor="transparent" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.9 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="32" cy="32" r="24" fill="url(#g2)" />
        <circle
          cx="32"
          cy="32"
          r="18.5"
          fill="none"
          stroke="url(#g1)"
          strokeWidth="2.75"
          opacity="0.95"
          filter="url(#glow)"
        />

        {/* nodes */}
        <g fill="url(#g1)" filter="url(#glow)">
          <circle cx="24" cy="30" r="2.2" />
          <circle cx="32" cy="24" r="2.2" />
          <circle cx="40" cy="30" r="2.2" />
          <circle cx="30" cy="40" r="2.2" />
          <circle cx="42" cy="41" r="2.2" />
        </g>

        {/* links */}
        <g stroke="url(#g1)" strokeWidth="2" opacity="0.85" filter="url(#glow)">
          <path d="M24 30 L32 24 L40 30" fill="none" />
          <path d="M24 30 L30 40" fill="none" />
          <path d="M40 30 L42 41" fill="none" />
          <path d="M30 40 L42 41" fill="none" />
        </g>
      </svg>

      {withWordmark ? (
        <span
          className={cn(
            "bg-gradient-to-br from-[hsl(255_85%_65%)] via-[hsl(200_95%_55%)] to-[hsl(285_85%_65%)]",
            "bg-clip-text text-transparent",
            "[text-shadow:0_0_22px_hsl(255_85%_65%_/_0.15)]",
            "font-black uppercase leading-none tracking-tight",
            "[font-family:var(--font-space-grotesk)]",
            wordmarkClassName
          )}
        >
          {wordmarkText}
        </span>
      ) : null}
    </div>
  );
}

