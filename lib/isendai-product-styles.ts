import { cn } from '@/lib/utils'

export const ISENDAI_ACCENT = '#8B5CF6'

export const isendaiPageSection = 'py-16 lg:py-24'

export const isendaiCard = cn(
  'rounded-2xl border border-[#E6EBF1] bg-white shadow-sm',
  'transition-shadow duration-200 hover:shadow-md'
)

export const isendaiSectionCard = cn(
  'rounded-3xl border border-[#E6EBF1] bg-white p-6 sm:p-8 lg:p-10 shadow-sm'
)

export const isendaiMutedSection = 'bg-[#F6F9FC]'

export const isendaiHeading = 'text-[#0A2540] font-bold tracking-tight'

export const isendaiBody = 'text-[#425466] leading-relaxed text-base sm:text-lg'

export const isendaiKicker = cn(
  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide sm:text-sm',
  'border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#6D28D9]'
)

export const isendaiPrimaryBtn = cn(
  'inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5',
  'text-base font-semibold text-white shadow-md transition-all hover:opacity-90'
)

export const isendaiOutlineBtn = cn(
  'inline-flex items-center justify-center gap-2 rounded-full border-2 px-8 py-3.5',
  'text-base font-semibold border-[#8B5CF6] text-[#0A2540] transition-colors hover:bg-[#8B5CF6]/10'
)
