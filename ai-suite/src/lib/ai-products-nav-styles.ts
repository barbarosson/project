import { cn } from "@/lib/utils";
import { sectionGradientSubheading } from "@/lib/premium-ui";

/**
 * AI Products sidebar — aligned with site typography:
 * - font-display (Space Grotesk): panel title, category headers, workspace eyebrow
 * - font-sans (Inter): tool rows, badges, chips, controls
 */
export const aiProductsNav = {
  sidebarTitle: sectionGradientSubheading,
  countBadge: cn(
    "font-sans rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-violet-200",
    "light:border-violet-400/45 light:bg-violet-100/80 light:text-violet-900"
  ),
  categoryRow: cn(
    "mb-2 flex w-full items-center justify-between gap-3 rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2.5 text-left transition-all duration-300 hover:border-violet-400/40 hover:bg-violet-500/15 hover:shadow-[0_8px_24px_rgba(139,92,246,0.15)]",
    "light:border-violet-300/50 light:bg-violet-100/70 light:hover:bg-violet-100/90 light:hover:shadow-[0_8px_20px_rgba(30,58,138,0.08)]"
  ),
  categoryRowOpen: cn(
    "border-violet-400/45 bg-violet-500/20 shadow-[0_8px_28px_rgba(139,92,246,0.2)]",
    "light:border-violet-500/50 light:bg-violet-200/80"
  ),
  categoryLabel: cn(
    "font-display text-sm font-semibold leading-snug text-slate-100",
    "light:text-slate-800"
  ),
  categoryLabelOpen: cn("text-violet-100", "light:text-violet-900"),
  categoryToggle: cn(
    "font-sans inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.05] text-indigo-300 transition-colors",
    "light:border-slate-300/70 light:bg-white/90 light:text-indigo-700"
  ),
  toolList: "grid gap-1.5 border-l-2 border-violet-500/20 pl-2 light:border-violet-400/40",
  toolRow: (isActive: boolean) =>
    cn(
      "font-sans group flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left",
      "text-[15px] font-medium leading-snug tracking-normal transition-all duration-300 sm:text-base",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
      isActive
        ? cn(
            "border-violet-500/45 bg-gradient-to-r from-violet-500/15 via-indigo-500/10 to-transparent text-white shadow-[0_0_20px_rgba(139,92,246,0.18)]",
            "light:border-violet-500/50 light:from-violet-200/80 light:via-indigo-100/60 light:text-slate-900"
          )
        : cn(
            "border-white/[0.1] bg-white/[0.04] text-slate-100 hover:border-violet-500/35 hover:bg-white/[0.07] hover:shadow-[0_0_12px_rgba(139,92,246,0.1)]",
            "light:border-slate-300/70 light:bg-white/75 light:text-slate-800 light:hover:bg-white/95"
          )
    ),
  toolEmoji: cn(
    "flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-lg leading-none",
    "light:bg-slate-200/80"
  ),
  toolEmojiActive: cn(
    "bg-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.25)]",
    "light:bg-violet-300/50"
  ),
  chip: (isActive: boolean) =>
    cn(
      "font-sans inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium leading-snug transition-all duration-300",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
      isActive
        ? cn(
            "border-violet-500/45 bg-violet-500/15 text-white shadow-[0_0_16px_rgba(139,92,246,0.22)]",
            "light:border-violet-500/50 light:bg-violet-200/80 light:text-slate-900"
          )
        : cn(
            "border-white/[0.12] bg-white/[0.05] text-slate-100 hover:border-violet-500/35 hover:bg-white/[0.08]",
            "light:border-slate-300/70 light:bg-white/80 light:text-slate-800 light:hover:bg-white"
          )
    ),
  workspaceCategory: cn(
    "font-display text-xs font-bold uppercase tracking-[0.16em] text-violet-300 sm:text-sm sm:tracking-[0.2em]",
    "light:text-violet-800"
  ),
} as const;
