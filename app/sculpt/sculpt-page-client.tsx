'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

type Countdown = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function clampNonNegative(n: number) {
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

function diffToCountdown(targetMs: number, nowMs: number): Countdown {
  const diff = clampNonNegative(targetMs - nowMs)
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds }
}

function format2(n: number) {
  return String(n).padStart(2, '0')
}

function TicketPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-sm text-white/70">{label}</span>
      <span className="text-base font-semibold tracking-tight text-white">{value}</span>
    </div>
  )
}

function FeatureCard({
  title,
  desc,
}: {
  title: string
  desc: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/75">{desc}</p>
    </div>
  )
}

function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-sky-500/25">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.15),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(125,211,252,0.18),transparent_60%)]" />
      <div className="relative flex h-full min-h-[180px] items-end p-4">
        <div className="rounded-xl bg-black/30 px-3 py-2 text-xs font-medium text-white/80 backdrop-blur">
          {label}
        </div>
      </div>
    </div>
  )
}

export function SculptPageClient() {
  const targetMs = useMemo(() => Date.UTC(2026, 9, 8, 7, 0, 0), []) // Oct 8, 2026 (UTC)
  const [nowMs, setNowMs] = useState<number>(() => Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const cd = useMemo(() => diffToCountdown(targetMs, nowMs), [targetMs, nowMs])

  const faq = [
    {
      q: 'Who should go to this conference?',
      a: "Any GTM leader or operator who wants to see what great looks like. If you’re in GTM Engineering, RevOps, Sales Ops, Marketing Ops, Demand Gen, or Growth Marketing, you’ll leave with workflows and tactics you can use immediately.",
    },
    {
      q: 'What is the format of the event?',
      a: 'A one-day conference with multiple stages, plus roundtables and interactive experiences. Talks are curated to stay tactical and operator-led.',
    },
    {
      q: 'Will drinks/food be served?',
      a: 'Coffee, breakfast, and lunch are included. Happy hour food and drinks follow the sessions.',
    },
    {
      q: 'Where will the event take place?',
      a: 'Pier 48, San Francisco.',
    },
    {
      q: 'Are there refunds? Can I transfer my ticket?',
      a: 'Full refund >30 days before, 50% refund 15–30 days, no refund <15 days. Tickets are transferable until 7 days before.',
    },
    {
      q: 'Where should I stay if I’m visiting SF?',
      a: 'Stay near Mission Rock / SoMa for easiest access. We recommend choosing a hotel within a short rideshare distance to Pier 48.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0B0B12] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0B12]/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/sculpt" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-black">
              S
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">sculpt</div>
              <div className="text-xs text-white/60">by Clay</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="#tickets">
              <Button className="rounded-full bg-white text-black hover:bg-white/90">
                Get tickets
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(168,85,247,0.35),transparent_55%),radial-gradient(circle_at_85%_30%,rgba(59,130,246,0.25),transparent_55%),radial-gradient(circle_at_50%_85%,rgba(236,72,153,0.22),transparent_60%)]" />
          <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/75">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              The go-to-market conference returns in 2026
            </div>

            <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
              <div>
                <p className="text-sm font-semibold text-white/70">sculpt 2026</p>
                <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  A one-day gathering of the most creative minds in GTM
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/75">
                  The GTM landscape is changing fast. Sculpt showcases how world-class teams
                  use AI, agents, and data to build workflows and systems that drive ROI.
                  You’ll walk away with tactics, a new perspective, and a few new friends.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="#tickets">
                    <Button className="rounded-full bg-white text-black hover:bg-white/90">
                      Get tickets
                    </Button>
                  </Link>
                  <Link href="#faq">
                    <Button
                      variant="outline"
                      className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
                    >
                      FAQ
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-xs font-semibold text-white/70">when</div>
                <div className="mt-1 text-lg font-semibold tracking-tight">
                  Thursday, October 8, 2026
                </div>
                <div className="mt-4 text-xs font-semibold text-white/70">where</div>
                <div className="mt-1 text-lg font-semibold tracking-tight">
                  Pier 48
                </div>
                <div className="text-sm text-white/70">San Francisco</div>

                <div className="mt-6 grid gap-3">
                  <TicketPill label="Days" value={String(cd.days)} />
                  <div className="grid grid-cols-3 gap-3">
                    <TicketPill label="Hours" value={format2(cd.hours)} />
                    <TicketPill label="Min" value={format2(cd.minutes)} />
                    <TicketPill label="Sec" value={format2(cd.seconds)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-14 rounded-3xl border border-white/10 bg-white/5 p-8">
              <p className="text-sm font-semibold text-white/80">Last year</p>
              <p className="mt-2 text-sm text-white/70">
                Sculpt featured GTM builders from top teams and operator-led communities.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {['Rippling', 'Oyster', 'Gong', 'HubSpot', 'Notion', 'Sendoso'].map((n) => (
                  <div
                    key={n}
                    className="flex items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-xs font-semibold text-white/75"
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Piece together the GTM building blocks
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <FeatureCard
              title="Data"
              desc="Learn how top Rev/Sales Ops teams leverage data to power revenue motions."
            />
            <FeatureCard
              title="AI"
              desc="See how AI agents and workflows can save you hours and drive pipeline."
            />
            <FeatureCard
              title="Orchestration"
              desc="Connect your data, tools, and AI to build scalable GTM engines."
            />
            <FeatureCard
              title="Execution"
              desc="Activate channels with playbooks that translate into real ROI."
            />
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/5">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              A different kind of conference
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <FeatureCard
                title="Curated"
                desc="No sponsored sessions. Talks are reviewed to ensure real operator value."
              />
              <FeatureCard
                title="Tactical"
                desc="No hand-wavy frameworks. Leave with workflows, automations, and playbooks."
              />
              <FeatureCard
                title="Experiential"
                desc="Designed to inspire creativity with interactive experiences and time to connect."
              />
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <PhotoPlaceholder label="Hallway tracks + roundtables" />
              <PhotoPlaceholder label="Operator-led sessions" />
              <PhotoPlaceholder label="Breakfast, lunch, closing party" />
              <PhotoPlaceholder label="Workshops + systems" />
              <PhotoPlaceholder label="Community moments" />
              <PhotoPlaceholder label="SF waterfront vibes" />
            </div>
          </div>
        </section>

        <section id="tickets" className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Get tickets
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
                GTM playbooks you’ll only get here. Sessions are just the start—meet and
                mingle with builders who care about systems that drive real ROI.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-7">
              <div className="text-sm font-semibold text-white/80">On sale now, until sold out</div>
              <div className="mt-4 text-5xl font-semibold tracking-tight">$600</div>
              <div className="mt-2 text-sm text-white/70">
                For a full day you won’t soon forget. Contact us for group orders.
              </div>

              <div className="mt-6 grid gap-3">
                <Button className="h-12 rounded-full bg-white text-black hover:bg-white/90">
                  Secure your spot
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  Group orders
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-white/10 bg-black/20">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">FAQ</h2>

            <div className="mt-8 max-w-3xl">
              <Accordion type="single" collapsible className="space-y-3">
                {faq.map((item, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`faq-${idx}`}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5"
                  >
                    <AccordionTrigger className="py-5 text-left text-sm font-semibold text-white hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-sm leading-6 text-white/75">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-white/70">© {new Date().getFullYear()} sculpt</div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link className="text-white/70 hover:text-white" href="#">
              Privacy policy
            </Link>
            <Link className="text-white/70 hover:text-white" href="#tickets">
              Group orders
            </Link>
            <Link className="text-white/70 hover:text-white" href="https://www.clay.com/">
              Clay.com
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

