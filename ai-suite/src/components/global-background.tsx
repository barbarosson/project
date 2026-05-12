"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

/** Deep abyss base + large violet/blue glow orbs (premium SaaS shell). */
export function GlobalBackground({ className }: { className?: string }) {
  const techStrokeId = useId().replace(/:/g, "");
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
    >
      <div className="absolute inset-0 bg-[#09090b]" />
      <div
        className={cn(
          "absolute -left-[22%] -top-[18%] size-[min(120vw,760px)] rounded-full bg-violet-600/20 blur-[150px]",
          "motion-safe:animate-[ambientPulse_14s_ease-in-out_infinite]"
        )}
      />
      <div
        className={cn(
          "absolute -bottom-[28%] -right-[18%] size-[min(115vw,720px)] rounded-full bg-blue-600/20 blur-[150px]",
          "motion-safe:animate-[ambientPulse_16s_ease-in-out_infinite]"
        )}
        style={{ animationDelay: "2s" }}
      />
      {/* Stripe-like slow parallelogram / ribbon geometry — violet · cyan tech accent */}
      <div className="absolute left-1/2 top-[38%] z-0 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-tech-orbit-cw absolute left-1/2 top-1/2 size-[min(92vw,880px)]">
          <div
            className={cn(
              "absolute inset-[6%] rounded-[40%] bg-gradient-to-tr from-violet-600/22 via-fuchsia-500/12 to-blue-600/18 blur-3xl",
              "-skew-x-[10deg] skew-y-[7deg]"
            )}
          />
        </div>
        <div className="animate-tech-orbit-ccw absolute left-1/2 top-1/2 size-[min(68vw,560px)] opacity-[0.5]">
          <div
            className={cn(
              "absolute inset-0 rounded-[34%] border border-violet-400/[0.09]",
              "bg-[conic-gradient(from_210deg_at_50%_45%,rgba(139,92,246,0.14),transparent_42%,rgba(56,189,248,0.08),transparent_78%)]",
              "skew-x-[14deg]"
            )}
          />
        </div>
        <svg
          className="animate-tech-orbit-ccw absolute left-1/2 top-1/2 size-[min(78vw,640px)] opacity-[0.18]"
          viewBox="0 0 400 400"
          aria-hidden
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={techStrokeId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(167 139 250)" stopOpacity="0.35" />
              <stop offset="50%" stopColor="rgb(56 189 248)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(192 132 252)" stopOpacity="0.28" />
            </linearGradient>
          </defs>
          <path
            d="M200 48 L332 200 L200 352 L68 200 Z"
            stroke={`url(#${techStrokeId})`}
            strokeWidth="0.75"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M200 96 L292 200 L200 304 L108 200 Z"
            stroke={`url(#${techStrokeId})`}
            strokeWidth="0.5"
            opacity="0.65"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="global-bg-grid absolute inset-0 opacity-[0.14]" />
      <div className="global-bg-noise absolute inset-0 opacity-[0.35]" />
      <div className="global-bg-vignette absolute inset-0" />
    </div>
  );
}
