import { cn } from '@/lib/utils'

export const isendaiPageRoot = 'isendai-product-page min-h-screen bg-slate-950 text-slate-100'

export const isendaiGlassCard = cn(
  'border border-white/[0.08] bg-white/[0.03] shadow-2xl backdrop-blur-xl',
  'transition-all duration-300 ease-out',
  'hover:-translate-y-1 hover:border-violet-500/50',
  'hover:shadow-[0_8px_40px_rgba(139,92,246,0.18),inset_0_1px_0_0_rgba(255,255,255,0.06)]'
)

export const isendaiSectionShell = cn(
  'relative min-w-0 overflow-hidden rounded-3xl border border-violet-500/30 p-4 sm:p-6 lg:p-10',
  'bg-gradient-to-br from-violet-950/50 via-slate-950/80 to-indigo-950/50',
  'shadow-[0_12px_56px_rgba(139,92,246,0.22),inset_0_1px_0_0_rgba(255,255,255,0.08)]',
  'backdrop-blur-xl'
)

export const isendaiGradientHeading = cn(
  'text-pretty font-bold leading-tight tracking-tight',
  'bg-gradient-to-r from-white via-violet-100 to-cyan-100 bg-clip-text text-transparent'
)

export const isendaiBody = 'text-pretty text-base font-medium leading-relaxed text-slate-200 sm:text-lg'

export const isendaiCta = cn(
  'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
  'px-6 py-3.5 text-base font-bold text-white shadow-md',
  'transition-all duration-200 hover:shadow-[0_0_24px_rgba(168,85,247,0.45)] active:scale-[0.98]'
)

export const isendaiOutlineBtn = cn(
  'inline-flex items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04]',
  'px-5 py-3 text-sm font-semibold text-slate-200 backdrop-blur-xl',
  'transition-all hover:border-violet-500/35 hover:bg-white/[0.07]'
)
