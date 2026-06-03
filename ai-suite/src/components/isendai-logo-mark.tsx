"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export type IsendaiLogoMarkProps = {
  className?: string;
};

function MarkSvg({
  className,
  uid,
  palette,
}: {
  className?: string;
  uid: string;
  palette: "dark" | "light";
}) {
  const grad = `${uid}-grad`;
  const glow = `${uid}-glow`;
  const softGlow = `${uid}-soft`;

  const stops =
    palette === "light"
      ? [
          { offset: "0%", color: "#6d28d9" },
          { offset: "48%", color: "#1d4ed8" },
          { offset: "100%", color: "#be185d" },
        ]
      : [
          { offset: "0%", color: "#c4b5fd" },
          { offset: "48%", color: "#38bdf8" },
          { offset: "100%", color: "#f0abfc" },
        ];

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={grad} x1="8%" y1="6%" x2="92%" y2="94%">
          {stops.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="42%" r="58%">
          <stop
            offset="0%"
            stopColor={palette === "light" ? "#c4b5fd" : "#8b5cf6"}
            stopOpacity={palette === "light" ? "0.45" : "0.5"}
          />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id={softGlow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="32" cy="32" r="26" fill={`url(#${glow})`} />

      <path
        d="M32 13.5 L48.5 22.5 V40.5 L32 49.5 L15.5 40.5 V22.5 Z"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="2.6"
        strokeLinejoin="round"
        filter={`url(#${softGlow})`}
      />

      <path
        d="M32 18.5 L44.5 25.5 V37.5 L32 44.5 L19.5 37.5 V25.5 Z"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="0.7"
        strokeOpacity="0.35"
      />

      <g fill={`url(#${grad})`} filter={`url(#${softGlow})`}>
        <circle cx="32" cy="21" r="2.35" />
        <circle cx="21" cy="31" r="2.1" />
        <circle cx="43" cy="31" r="2.1" />
        <circle cx="27.5" cy="41.5" r="1.95" />
        <circle cx="36.5" cy="41.5" r="1.95" />
      </g>

      <g stroke={`url(#${grad})`} strokeWidth="1.9" strokeLinecap="round" fill="none">
        <path d="M32 23.25 L21 31" />
        <path d="M32 23.25 L43 31" />
        <path d="M21 31 L27.5 41.5" />
        <path d="M43 31 L36.5 41.5" />
        <path d="M27.5 41.5 L36.5 41.5" />
      </g>
    </svg>
  );
}

/**
 * Brand mark: hexagon frame + neural nodes (violet · cyan · fuchsia).
 * Renders dark + light SVG from html.dark / html.light (no theme hook — reliable HMR).
 */
export function IsendaiLogoMark({ className }: IsendaiLogoMarkProps) {
  const uid = useId().replace(/:/g, "");
  const sizeClass = cn("size-8 shrink-0", className);

  return (
    <span className="relative inline-flex shrink-0">
      <MarkSvg
        uid={`${uid}-d`}
        palette="dark"
        className={cn(sizeClass, "hidden dark:block")}
      />
      <MarkSvg
        uid={`${uid}-l`}
        palette="light"
        className={cn(sizeClass, "block dark:hidden")}
      />
    </span>
  );
}
