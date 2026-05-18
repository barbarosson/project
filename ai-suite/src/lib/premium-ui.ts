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

/** Large marketing sections (How it works, AI Products workspace). */
export const sectionGradientShell = cn(
  "relative min-w-0 overflow-hidden rounded-3xl border border-violet-500/30 p-4 sm:p-6 lg:p-10",
  "bg-gradient-to-br from-violet-950/50 via-slate-950/80 to-indigo-950/50",
  "shadow-[0_12px_56px_rgba(139,92,246,0.22),inset_0_1px_0_0_rgba(255,255,255,0.08)]",
  "backdrop-blur-xl"
);

export const sectionGradientHeading = cn(
  "text-pretty text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl",
  "bg-gradient-to-r from-white via-violet-100 to-cyan-100 bg-clip-text text-transparent"
);

export const sectionGradientSubheading = cn(
  "text-pretty text-xl font-bold leading-tight tracking-tight sm:text-2xl",
  "bg-gradient-to-r from-white via-violet-100 to-cyan-100 bg-clip-text text-transparent"
);

export const sectionGradientBody =
  "text-base font-medium leading-relaxed text-slate-200 sm:text-lg";

export const sectionGradientBodySm =
  "text-sm leading-relaxed text-slate-200 sm:text-base";

export const sectionPanelViolet = cn(
  "rounded-2xl border border-violet-400/35 bg-gradient-to-br from-violet-500/15 to-violet-950/30",
  "shadow-lg backdrop-blur-md"
);

export const sectionPanelFuchsia = cn(
  "rounded-2xl border border-fuchsia-400/35 bg-gradient-to-br from-fuchsia-500/15 to-fuchsia-950/30",
  "shadow-lg backdrop-blur-md"
);

export const sectionPanelCyan = cn(
  "rounded-2xl border border-cyan-400/35 bg-gradient-to-br from-cyan-500/15 to-cyan-950/30",
  "shadow-lg backdrop-blur-md"
);

/** Inner pages — matches home marketing headings & body. */
export const pageTitle = sectionGradientHeading;

export const pageSubtitle = sectionGradientBodySm;

export const pageMeta = "text-sm font-medium text-slate-300 sm:text-base";

export const pageBackLink =
  "text-sm font-medium text-violet-300 transition-colors hover:text-violet-200";

export const pageOutlineButton = cn(
  interactiveClick,
  "inline-flex items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur-xl hover:border-violet-500/35 hover:bg-white/[0.07]"
);

export const pageContentSection = cn(glassInteractive, "rounded-2xl p-6");

export const pageHeroPanel = cn(
  glassInteractive,
  "relative overflow-hidden rounded-2xl px-6 py-8 sm:px-10"
);

export const pageStatValue =
  "mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl";

export const pageSectionLabel = cn(
  "text-sm font-semibold sm:text-base",
  "bg-gradient-to-r from-white via-violet-100 to-cyan-100 bg-clip-text text-transparent"
);
