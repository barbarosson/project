import { cn } from "@/lib/utils";

/** AI Products sidebar + mobile chip typography (readable, tech-forward). */
export const aiProductsNav = {
  sidebarTitle: "text-base font-bold tracking-tight text-slate-50 sm:text-lg",
  countBadge:
    "rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-violet-200",
  categoryRow:
    "mb-2 flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left transition-all duration-300 hover:border-violet-500/25 hover:bg-white/[0.05]",
  categoryRowOpen: "border-violet-500/30 bg-violet-500/[0.07] shadow-[0_0_20px_rgba(139,92,246,0.08)]",
  categoryLabel: "text-sm font-semibold leading-snug text-slate-200",
  categoryLabelOpen: "text-violet-100",
  categoryToggle:
    "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.05] text-indigo-300 transition-colors",
  toolList: "grid gap-1.5 border-l-2 border-violet-500/20 pl-2",
  toolRow: (isActive: boolean) =>
    cn(
      "group flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left",
      "text-[15px] font-medium leading-snug tracking-tight transition-all duration-300 sm:text-base",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
      isActive
        ? "border-violet-500/45 bg-gradient-to-r from-violet-500/15 via-indigo-500/10 to-transparent text-white shadow-[0_0_20px_rgba(139,92,246,0.18)]"
        : "border-white/[0.1] bg-white/[0.04] text-slate-100 hover:border-violet-500/35 hover:bg-white/[0.07] hover:shadow-[0_0_12px_rgba(139,92,246,0.1)]"
    ),
  toolEmoji: "flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-lg leading-none",
  toolEmojiActive: "bg-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.25)]",
  chip: (isActive: boolean) =>
    cn(
      "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium leading-snug transition-all duration-300",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
      isActive
        ? "border-violet-500/45 bg-violet-500/15 text-white shadow-[0_0_16px_rgba(139,92,246,0.22)]"
        : "border-white/[0.12] bg-white/[0.05] text-slate-100 hover:border-violet-500/35 hover:bg-white/[0.08]"
    ),
  workspaceCategory: "text-sm font-semibold text-violet-300/90",
} as const;
