'use client'

import Link from 'next/link'
import { ArrowRight, Globe, MoveRight, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { getCorporateCopy } from '@/lib/corporate-marketing-copy'
import {
  isendaiBody,
  isendaiCta,
  isendaiGlassCard,
  isendaiGradientHeading,
  isendaiOutlineBtn,
  isendaiPageRoot,
  isendaiSectionShell,
} from '@/lib/isendai-product-styles'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const ISENDAI_URL = process.env.NEXT_PUBLIC_ISENDAI_URL ?? 'https://isendai.com'
const CONTAINER = 'mx-auto w-full min-w-0 max-w-6xl px-4 sm:px-6 lg:px-8'

export function IsendaiProductContent() {
  const { language, setLanguage } = useLanguage()
  const p = getCorporateCopy(language).isendaiPage

  return (
    <div className={isendaiPageRoot}>
      <header className={cn(CONTAINER, 'flex flex-wrap items-center justify-between gap-4 py-5 sm:py-6')}>
        <Link href={ISENDAI_URL} className="group flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'text-2xl font-bold tracking-tight sm:text-3xl',
              'bg-gradient-to-r from-violet-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent'
            )}
          >
            isendai
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <Globe className="h-4 w-4" />
                <span className="uppercase font-semibold">{language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('tr')}>Türkçe (TR)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('en')}>English (EN)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/" className={isendaiOutlineBtn}>
            {p.secondaryCta}
          </Link>
          <a href={ISENDAI_URL} target="_blank" rel="noopener noreferrer" className={isendaiCta}>
            {p.primaryCta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <main className={cn(CONTAINER, 'space-y-8 pb-16 pt-2')}>
        <section className={cn('relative overflow-hidden rounded-2xl px-6 py-8 sm:px-10', isendaiGlassCard)}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(124,58,237,0.22)_0%,transparent_70%)]"
          />
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/35 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-violet-100 sm:text-sm">
            <Sparkles className="size-3.5 shrink-0 text-fuchsia-300 sm:size-4" aria-hidden />
            {p.hero.kicker}
          </p>
          <h1 className={cn('mt-4 text-3xl sm:text-4xl lg:text-5xl', isendaiGradientHeading)}>
            {p.hero.title}
          </h1>
          <p className={cn('mt-4 max-w-3xl', isendaiBody)}>{p.hero.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {p.hero.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
              >
                {badge}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href={ISENDAI_URL} target="_blank" rel="noopener noreferrer" className={cn(isendaiCta, 'sm:min-w-[14rem]')}>
              {p.hero.cta}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href={`${ISENDAI_URL}/pricing`} target="_blank" rel="noopener noreferrer" className={isendaiOutlineBtn}>
              {language === 'tr' ? 'Paketler & fiyat' : 'Plans & pricing'}
            </a>
          </div>
        </section>

        <section className={isendaiSectionShell}>
          <h2 className={cn('text-2xl sm:text-3xl lg:text-4xl', isendaiGradientHeading)}>{p.aiStack.title}</h2>
          <p className={cn('mt-4 max-w-4xl', isendaiBody)}>{p.aiStack.body}</p>
        </section>

        <section className={isendaiSectionShell}>
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-200">
            <Sparkles className="size-3.5 text-fuchsia-300" aria-hidden />
            {p.demo.before} → {p.demo.after}
          </p>
          <h2 className={cn('mt-4 text-2xl sm:text-3xl lg:text-4xl', isendaiGradientHeading)}>{p.demo.title}</h2>
          <p className={cn('mt-4', isendaiBody)}>{p.demo.subtitle}</p>

          <div className="mt-8 grid min-w-0 gap-5 lg:grid-cols-2">
            {p.demo.examples.map((ex) => (
              <div
                key={ex.title}
                className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.1] bg-black/25 p-4 sm:p-5"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl border border-violet-400/25 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 text-lg">
                    {ex.emoji}
                  </span>
                  <span className="font-semibold text-white">{ex.title}</span>
                </div>
                <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                  <div className="rounded-xl border border-rose-400/35 bg-gradient-to-br from-rose-500/15 to-rose-950/30 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-rose-300">{p.demo.before}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-100 sm:text-base">{ex.before}</p>
                  </div>
                  <div className="flex items-center justify-center py-1 lg:py-0">
                    <span className="inline-flex size-10 items-center justify-center rounded-full border border-violet-400/40 bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/20 text-violet-100 shadow-[0_0_24px_rgba(139,92,246,0.35)]">
                      <MoveRight className="size-4" aria-hidden />
                    </span>
                  </div>
                  <div className="rounded-xl border border-emerald-400/35 bg-gradient-to-br from-emerald-500/15 to-emerald-950/30 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">{p.demo.after}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-50 sm:text-base">{ex.after}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={isendaiSectionShell}>
          <h2 className={cn('text-2xl sm:text-3xl lg:text-4xl', isendaiGradientHeading)}>{p.how.title}</h2>
          <p className={cn('mt-4', isendaiBody)}>{p.how.subtitle}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {p.how.steps.map((step, i) => {
              const borders = [
                'border-violet-400/35 from-violet-500/15 to-violet-950/30',
                'border-fuchsia-400/35 from-fuchsia-500/15 to-fuchsia-950/30',
                'border-cyan-400/35 from-cyan-500/15 to-cyan-950/30',
                'border-emerald-400/35 from-emerald-500/15 to-emerald-950/30',
              ]
              return (
                <div
                  key={step.title}
                  className={cn(
                    'rounded-2xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur-md',
                    borders[i]
                  )}
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">{step.body}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className={isendaiSectionShell}>
          <h2 className={cn('text-2xl sm:text-3xl', isendaiGradientHeading)}>{p.tools.title}</h2>
          <p className={cn('mt-3', isendaiBody)}>{p.tools.subtitle}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {p.tools.items.map((tool) => (
              <div
                key={tool.title}
                className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-6 backdrop-blur-md"
              >
                <h3 className="font-semibold text-white">{tool.title}</h3>
                <p className="mt-2 text-sm text-violet-200">{tool.slogan}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-violet-500/40 bg-gradient-to-r from-violet-900/40 via-fuchsia-900/30 to-indigo-900/40 px-6 py-12 text-center sm:px-10">
          <h2 className={cn('text-2xl sm:text-3xl', isendaiGradientHeading)}>
            {language === 'tr' ? 'Hazır mısınız?' : 'Ready to try?'}
          </h2>
          <p className={cn('mx-auto mt-4 max-w-xl', isendaiBody)}>
            {language === 'tr'
              ? 'Tam uygulama isendai.com üzerinde — concierge, tüm araçlar ve kredi paketleri.'
              : 'Full app at isendai.com — concierge, every tool, and credit packs.'}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={ISENDAI_URL} target="_blank" rel="noopener noreferrer" className={isendaiCta}>
              {p.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-8 text-xs text-slate-400 sm:text-sm">{p.trust}</p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-violet-300 hover:text-violet-200">
            {p.backToModulus}
          </Link>
        </section>
      </main>
    </div>
  )
}

