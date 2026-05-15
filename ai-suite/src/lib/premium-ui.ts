import { cn } from "@/lib/utils";

/** Base frosted glass surface (sections, inputs shell, static panels). */
export const glassSurface =
  "border border-white/[0.08] bg-white/[0.03] shadow-2xl backdrop-blur-xl";

/** Glass + hover lift/glow for interactive cards and tool tiles. */
export const glassInteractive = cn(
  glassSurface,
  "transition-all duration-300 ease-out",
  "hover:-translate-y-1 hover:border-violet-500/50",
  "hover:shadow-[0_8px_40px_rgba(139,92,246,0.18),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
);

/** Shared pointer + press feedback for custom links / controls (also in globals.css `base`). */
export const interactiveClick =
  "cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

/** Primary gradient CTA (matches Button default). */
export const premiumCta = cn(
  interactiveClick,
  "inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95"
);

/** Page titles: bright → soft white gradient (see `.text-gradient-hero` in globals.css). */
export const textGradientHero = "text-gradient-hero";
