import { cn } from "@/lib/utils";

/** Base frosted glass surface (sections, inputs shell, static panels). */
export const glassSurface = cn(
  "border border-white/[0.08] bg-white/[0.03] shadow-2xl backdrop-blur-xl",
  "light:border-slate-300/70 light:bg-white/75 light:shadow-[0_8px_32px_rgba(30,41,90,0.08)]"
);

/** Glass + hover lift/glow for interactive cards and tool tiles. */
export const glassInteractive = cn(
  glassSurface,
  "transition-all duration-300 ease-out",
  "hover:-translate-y-1 hover:border-violet-500/50",
  "hover:shadow-[0_8px_40px_rgba(139,92,246,0.18),inset_0_1px_0_0_rgba(255,255,255,0.06)]",
  "light:hover:border-fuchsia-400/45 light:hover:shadow-[0_8px_32px_rgba(190,24,114,0.12)]"
);

/** Shared pointer + press feedback for custom links / controls (also in globals.css `base`). */
export const interactiveClick =
  "cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

/** Primary gradient CTA (matches Button default). */
export const premiumCta = cn(
  interactiveClick,
  "inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95",
  "light:from-indigo-600 light:via-violet-700 light:to-fuchsia-600"
);

/** Page titles: bright → soft white gradient (see `.text-gradient-hero` in globals.css). */
export const textGradientHero = "text-gradient-hero";

const headingGradient = cn(
  "bg-gradient-to-r from-white via-violet-100 to-cyan-100 bg-clip-text text-transparent",
  "light:from-slate-900 light:via-violet-900 light:to-indigo-800"
);

/** Large marketing sections (How it works, AI Products workspace). */
export const sectionGradientShell = cn(
  "relative min-w-0 overflow-hidden rounded-3xl border border-violet-500/30 p-4 sm:p-6 lg:p-10",
  "bg-gradient-to-br from-violet-950/50 via-slate-950/80 to-indigo-950/50",
  "shadow-[0_12px_56px_rgba(139,92,246,0.22),inset_0_1px_0_0_rgba(255,255,255,0.08)]",
  "backdrop-blur-xl",
  "light:border-indigo-300/50 light:from-slate-200/90 light:via-violet-100/80 light:to-indigo-100/90",
  "light:shadow-[0_12px_40px_rgba(30,58,138,0.12)]"
);

export const sectionGradientHeading = cn(
  "font-display text-pretty text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl",
  headingGradient
);

export const sectionGradientSubheading = cn(
  "font-display text-pretty text-xl font-bold leading-tight tracking-tight sm:text-2xl",
  headingGradient
);

export const sectionGradientBody = cn(
  "text-base font-medium leading-relaxed text-slate-200 sm:text-lg",
  "light:text-slate-700"
);

export const sectionGradientBodySm = cn(
  "text-sm leading-relaxed text-slate-200 sm:text-base",
  "light:text-slate-700"
);

export const sectionPanelViolet = cn(
  "rounded-2xl border border-violet-400/35 bg-gradient-to-br from-violet-500/15 to-violet-950/30",
  "shadow-lg backdrop-blur-md",
  "light:border-violet-300/50 light:from-violet-200/60 light:to-violet-100/80"
);

export const sectionPanelFuchsia = cn(
  "rounded-2xl border border-fuchsia-400/35 bg-gradient-to-br from-fuchsia-500/15 to-fuchsia-950/30",
  "shadow-lg backdrop-blur-md",
  "light:border-fuchsia-300/50 light:from-fuchsia-200/50 light:to-pink-100/70"
);

export const sectionPanelCyan = cn(
  "rounded-2xl border border-cyan-400/35 bg-gradient-to-br from-cyan-500/15 to-cyan-950/30",
  "shadow-lg backdrop-blur-md",
  "light:border-indigo-300/50 light:from-indigo-100/70 light:to-slate-200/80"
);

/** Inner pages — matches home marketing headings & body. */
export const pageTitle = sectionGradientHeading;

export const pageSubtitle = sectionGradientBodySm;

export const pageMeta = cn(
  "text-sm font-medium text-slate-300 sm:text-base",
  "light:text-slate-600"
);

export const pageBackLink = cn(
  "text-sm font-medium text-violet-300 transition-colors hover:text-violet-200",
  "light:text-violet-800 light:hover:text-fuchsia-700"
);

export const pageOutlineButton = cn(
  interactiveClick,
  "inline-flex items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur-xl hover:border-violet-500/35 hover:bg-white/[0.07]",
  "light:border-slate-300/80 light:bg-white/80 light:text-slate-800 light:hover:border-violet-400/50 light:hover:bg-white"
);

export const pageContentSection = cn(glassInteractive, "rounded-2xl p-6");

export const pageHeroPanel = cn(
  glassInteractive,
  "relative overflow-hidden rounded-2xl px-6 py-8 sm:px-10"
);

export const pageStatValue = cn(
  "mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl",
  "light:text-slate-900"
);

export const pageSectionLabel = cn(
  "text-sm font-semibold sm:text-base",
  headingGradient
);

/** Marketing / home section headings (gradient text). */
export const marketingHeading = sectionGradientHeading;

/** Body copy on gradient marketing sections. */
export const marketingBody = sectionGradientBody;

export const marketingBodyXL = cn(
  marketingBody,
  "lg:text-[1.125rem] lg:leading-relaxed xl:text-xl"
);

export const heroKicker = cn(
  "inline-flex items-center gap-2 rounded-full border border-violet-400/35 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-violet-100 sm:text-sm",
  "light:border-violet-400/45 light:from-violet-200/70 light:to-fuchsia-100/60 light:text-violet-950"
);

export const marketingLink = cn(
  "font-semibold text-violet-200 underline-offset-2 transition-colors hover:text-white hover:underline",
  "light:text-violet-800 light:hover:text-fuchsia-800"
);

export const sectionShellCyan = cn(
  "relative mt-8 min-w-0 overflow-hidden rounded-3xl border border-cyan-500/25 p-4 sm:p-6 lg:p-10",
  "bg-gradient-to-br from-cyan-950/40 via-slate-950/85 to-violet-950/45",
  "shadow-[0_12px_56px_rgba(34,211,238,0.14),inset_0_1px_0_0_rgba(255,255,255,0.08)]",
  "backdrop-blur-xl",
  "light:border-indigo-300/50 light:from-slate-100/95 light:via-cyan-50/90 light:to-violet-100/85",
  "light:shadow-[0_12px_36px_rgba(30,58,138,0.1)]"
);

export const expertBotsKicker = cn(
  "inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-200 sm:text-sm",
  "light:border-cyan-500/40 light:bg-cyan-100/70 light:text-cyan-950"
);

export const demoBadge = cn(
  "inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-200 sm:text-sm",
  "light:border-violet-400/45 light:bg-violet-100/75 light:text-violet-950"
);

export const demoExampleCard = cn(
  "min-w-0 overflow-hidden rounded-2xl border border-white/[0.1] bg-black/25 p-4 sm:p-5 lg:p-6",
  "shadow-lg backdrop-blur-md transition-all duration-300",
  "hover:-translate-y-1 hover:border-violet-400/35 hover:shadow-[0_12px_40px_rgba(139,92,246,0.2)]",
  "light:border-slate-300/75 light:bg-white/90 light:hover:border-fuchsia-400/40 light:hover:shadow-[0_12px_32px_rgba(30,58,138,0.1)]"
);

export const demoCardTitle = cn(
  "group flex min-w-0 max-w-full items-center gap-2 text-base font-semibold text-white sm:gap-3 sm:text-lg",
  "light:text-slate-900"
);

export const demoBeforeText = cn(
  "mt-2.5 break-words text-sm leading-relaxed text-slate-100 sm:text-base lg:text-[17px]",
  "light:text-slate-800"
);

export const demoAfterText = cn(
  "mt-2.5 break-words text-sm leading-relaxed text-slate-50 sm:text-base lg:text-[17px]",
  "light:text-slate-900"
);

export const surfaceTitle = cn(
  "text-base font-bold text-white sm:text-lg",
  "light:text-slate-900"
);

export const surfaceBody = cn(
  "text-sm leading-relaxed text-slate-200 sm:text-base",
  "light:text-slate-800"
);

export const HOW_STEP_STYLES = [
  {
    border: "border-violet-400/35 light:border-violet-400/55",
    bg: "from-violet-500/15 to-violet-950/30 light:from-violet-200/75 light:to-violet-50/95",
    badge: "bg-violet-500/25 text-violet-100 light:bg-violet-300/55 light:text-violet-950",
  },
  {
    border: "border-fuchsia-400/35 light:border-fuchsia-400/55",
    bg: "from-fuchsia-500/15 to-fuchsia-950/30 light:from-fuchsia-200/70 light:to-pink-50/95",
    badge: "bg-fuchsia-500/25 text-fuchsia-100 light:bg-fuchsia-300/55 light:text-fuchsia-950",
  },
  {
    border: "border-cyan-400/35 light:border-cyan-500/50",
    bg: "from-cyan-500/15 to-cyan-950/30 light:from-cyan-100/80 light:to-slate-100/95",
    badge: "bg-cyan-500/25 text-cyan-100 light:bg-cyan-300/55 light:text-cyan-950",
  },
  {
    border: "border-emerald-400/35 light:border-emerald-400/55",
    bg: "from-emerald-500/15 to-emerald-950/30 light:from-emerald-100/75 light:to-emerald-50/95",
    badge: "bg-emerald-500/25 text-emerald-100 light:bg-emerald-300/55 light:text-emerald-950",
  },
] as const;

export const workspaceHintBadge = cn(
  "font-sans inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-100 sm:text-sm",
  "light:border-violet-400/45 light:bg-violet-100/75 light:text-violet-950"
);

export const workspaceToolShell = cn(
  "mt-5 rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/10 to-slate-950/40 p-1 shadow-lg backdrop-blur-md sm:p-2",
  "light:border-violet-300/55 light:from-violet-100/80 light:to-slate-100/95 light:shadow-[0_8px_28px_rgba(30,58,138,0.08)]"
);

export const creditsSummaryText = cn(
  "font-medium text-slate-100",
  "light:text-slate-800"
);
