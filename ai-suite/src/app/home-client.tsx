"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Minus, MoveRight, Plus, Sparkles } from "lucide-react";

import { ToolCard } from "@/components/ai-suite/tool-card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { IsendaiLogo } from "@/components/isendai-logo";
import { useI18n } from "@/i18n/i18n-provider";
import { toolDescription, toolTitle } from "@/i18n/tool-i18n";
import { ModelSwitcher } from "@/components/model-switcher";
import { ConciergeChat } from "@/components/concierge-chat";
import { AuthStatus } from "@/components/auth-status";
import {
  TOOLS,
  type ToolCategory,
  type ToolName,
  getToolDefinition,
} from "@/components/ai-suite/tools";
import { cn } from "@/lib/utils";
import { glassInteractive, glassSurface, textGradientHero } from "@/lib/premium-ui";

import type { HomeCreditsSnapshot } from "@/app/home-credits-snapshot";

export function HomeClient({ creditsSnapshot }: { creditsSnapshot: HomeCreditsSnapshot | null }) {
  const { t } = useI18n();

  const categories: ToolCategory[] = [
    "work-career",
    "crisis-money",
    "social-dating",
    "freelance-business",
    "academic-bureaucracy",
    "neighbors-living",
    "creators-media",
    "family-deep-personal",
  ];
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedFromUrl = searchParams.get("tool") as ToolName | null;
  const defaultTool = TOOLS[0]?.tool ?? "corporate-whisperer";
  const [selected, setSelected] = React.useState<ToolName>(
    selectedFromUrl && TOOLS.some((x) => x.tool === selectedFromUrl)
      ? selectedFromUrl
      : defaultTool
  );
  const [expanded, setExpanded] = React.useState<Record<ToolCategory, boolean>>({
    "work-career": false,
    "crisis-money": false,
    "social-dating": false,
    "freelance-business": false,
    "academic-bureaucracy": false,
    "neighbors-living": false,
    "creators-media": false,
    "family-deep-personal": false,
  });

  const selectedDef = getToolDefinition(selected);
  const demoExamples: { tool: ToolName; key: string }[] = [
    { tool: "corporate-whisperer", key: "corp" },
    { tool: "graceful-quitter", key: "quit" },
    { tool: "awkward-text-fixer", key: "gift" },
    { tool: "corporate-to-caveman-translator", key: "caveman" },
  ];

  return (
    <div className="min-h-full">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-start justify-between gap-3 px-4 py-4 sm:items-center sm:py-5">
        <div className="flex min-w-0 flex-1 items-center">
          <IsendaiLogo
            withWordmark
            className="shrink-0 gap-2 sm:gap-3"
            iconClassName="size-10 shrink-0 sm:size-12 md:size-14 lg:size-16 xl:size-20"
            wordmarkClassName="inline-flex items-baseline whitespace-nowrap text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <AuthStatus />
          <LanguageSwitcher className="px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm" />
          <ModelSwitcher
            tool={selected}
            className="min-w-0 max-w-[10.5rem] px-2 py-1.5 text-xs sm:max-w-none sm:px-3 sm:py-2 sm:text-sm"
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16">
        <section
          className={cn(
            "relative overflow-hidden rounded-2xl px-6 py-8 sm:px-10",
            glassInteractive
          )}
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(124,58,237,0.18)_0%,transparent_70%)]" />
          <p className="text-sm font-medium text-slate-400">{t("hero.kicker")}</p>
          <h1
            className={cn(
              "mt-2 text-balance text-2xl font-semibold tracking-tight sm:text-4xl",
              textGradientHero
            )}
          >
            {t("hero.title")}
          </h1>
          <p className="mt-3 max-w-3xl text-balance text-sm text-slate-400 sm:text-base">
            {t("hero.subtitle")}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border border-violet-500/35 bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-pink-500/15 px-3 py-1.5 text-xs font-semibold text-violet-100 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-violet-400/50 hover:shadow-[0_0_18px_rgba(168,85,247,0.25)] active:scale-95"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/history"
              className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-xl transition-all duration-300 hover:border-violet-500/35 hover:bg-white/[0.07] active:scale-95"
            >
              {t("nav.history")}
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-xl transition-all duration-300 hover:border-violet-500/35 hover:bg-white/[0.07] active:scale-95"
            >
              {t("nav.pricing")}
            </Link>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-xl">
              {t("home.guestMemberBadges")}
            </span>
          </div>
          {creditsSnapshot ? (
            <div
              className={cn(
                "mt-4 rounded-xl px-4 py-3 text-xs text-slate-300 sm:text-sm",
                glassSurface
              )}
            >
              <p className="font-medium text-slate-100">
                {t("home.creditsSummary")
                  .replace("{credits}", String(creditsSnapshot.balance))
                  .replace("{max}", String(creditsSnapshot.maxVersions))
                  .replace(
                    "{scope}",
                    creditsSnapshot.owner === "user"
                      ? t("home.creditsScopeUser")
                      : t("home.creditsScopeGuest")
                  )}
              </p>
              {creditsSnapshot.owner === "anon" ? (
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400 sm:text-xs">
                  {t("home.creditsGuestHint")}{" "}
                  <Link href="/login?next=%2Fclaim" className="text-violet-300 underline hover:text-violet-200">
                    {t("nav.login")}
                  </Link>
                </p>
              ) : null}
              {creditsSnapshot.balance === 0 ? (
                <p className="mt-2 text-[11px] leading-relaxed text-amber-200/90 sm:text-xs">
                  {t("growth.zeroCreditsHint")}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className={cn("mt-6 rounded-2xl p-6", glassInteractive)}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold tracking-tight", textGradientHero)}>
                {t("home.demo.title")}
              </p>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">{t("home.demo.subtitle")}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {demoExamples.map(({ tool, key }) => (
              <div
                key={tool}
                className={cn("rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5", glassSurface)}
              >
                <Link
                  href={`/?tool=${tool}`}
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-100 hover:underline"
                >
                  <span className="inline-flex size-7 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04]">
                    <span aria-hidden="true">{getToolDefinition(tool).emoji}</span>
                  </span>
                  <span className="truncate">
                    {toolTitle(t, tool, getToolDefinition(tool).title)}
                  </span>
                  <ArrowRight className="size-4 text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 transition-colors">
                    <p className="text-xs font-semibold text-rose-400">
                      {t("home.demo.before.label")}
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-200">
                      {t(`home.demo.examples.${key}.before`)}
                    </p>
                  </div>
                  <div className="hidden items-center justify-center lg:flex">
                    <span className="inline-flex size-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-indigo-400">
                      <MoveRight className="size-4" />
                    </span>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 transition-colors">
                    <p className="text-xs font-semibold text-emerald-400">
                      {t("home.demo.after.label")}
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-200">
                      {t(`home.demo.examples.${key}.after`)}
                    </p>
                  </div>
                  <div className="flex items-center justify-center lg:hidden">
                    <span className="inline-flex size-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-indigo-400">
                      <MoveRight className="size-4" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={cn("mt-6 rounded-2xl p-6", glassInteractive)}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className={cn("text-pretty text-lg font-semibold tracking-tight", textGradientHero)}>
                {t("how.detailed.title")}
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                {t("how.detailed.subtitle")}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className={cn("rounded-xl p-4 transition-all duration-300 hover:border-violet-500/40", glassSurface)}>
              <p className="text-sm font-semibold text-white">{t("how.detailed.1.title")}</p>
              <p className="mt-1 text-sm text-slate-400">{t("how.detailed.1.body")}</p>
            </div>
            <div className={cn("rounded-xl p-4 transition-all duration-300 hover:border-violet-500/40", glassSurface)}>
              <p className="text-sm font-semibold text-white">{t("how.detailed.2.title")}</p>
              <p className="mt-1 text-sm text-slate-400">{t("how.detailed.2.body")}</p>
            </div>
            <div className={cn("rounded-xl p-4 transition-all duration-300 hover:border-violet-500/40", glassSurface)}>
              <p className="text-sm font-semibold text-white">{t("how.detailed.3.title")}</p>
              <p className="mt-1 text-sm text-slate-400">{t("how.detailed.3.body")}</p>
            </div>
            <div className={cn("rounded-xl p-4 transition-all duration-300 hover:border-violet-500/40", glassSurface)}>
              <p className="text-sm font-semibold text-white">{t("how.detailed.4.title")}</p>
              <p className="mt-1 text-sm text-slate-400">{t("how.detailed.4.body")}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left: tool list */}
          <aside className={cn("hidden rounded-2xl p-4 lg:block", glassSurface)}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-100">{t("home.sidebar.title")}</p>
              <span className="text-xs text-muted-foreground">{TOOLS.length}</span>
            </div>

            <div className="grid gap-4">
              {categories.map((cat) => (
                <div key={cat}>
                  <button
                    type="button"
                    className="mb-2 flex w-full items-center justify-between gap-2 text-left"
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }))
                    }
                  >
                    <p className="text-xs font-semibold text-slate-400">
                      {t(`category.${cat}.label`)}
                    </p>
                    <span className="inline-flex size-6 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.04] text-indigo-400">
                      {expanded[cat] ? <Minus className="size-4" /> : <Plus className="size-4" />}
                    </span>
                  </button>

                  {expanded[cat] ? (
                    <div className="grid gap-1">
                      {TOOLS.filter((x) => x.category === cat).map((x) => {
                        const isActive = x.tool === selected;
                        return (
                          <button
                            key={x.tool}
                            type="button"
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-all duration-300",
                              isActive
                                ? "border-violet-500/40 bg-violet-500/10 text-white shadow-[0_0_16px_rgba(139,92,246,0.12)]"
                                : "border-white/[0.08] bg-white/[0.03] text-slate-100 hover:border-violet-500/30 hover:bg-white/[0.06]"
                            )}
                            onClick={() => {
                              setSelected(x.tool);
                              router.replace(`/?tool=${x.tool}`);
                            }}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0" aria-hidden="true">
                                {x.emoji}
                              </span>
                              <span className="truncate">{toolTitle(t, x.tool, x.title)}</span>
                            </span>
                            <ArrowRight
                              className={cn(
                                "size-4 shrink-0",
                                isActive ? "text-violet-300" : "text-indigo-400"
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </aside>

          {/* Right: workspace */}
          <section className={cn("rounded-2xl p-4 sm:p-6", glassInteractive)}>
            <div className="mb-4 lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-100">{t("home.sidebar.title")}</p>
                <span className="text-xs text-muted-foreground">{TOOLS.length}</span>
              </div>
              <div className="mt-3 -mx-2 overflow-x-auto whitespace-nowrap px-2">
                <div className="flex w-max gap-2 pb-1">
                  {categories.map((cat) => {
                    const isActive = selectedDef.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={cn(
                          "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300",
                          "focus:outline-none focus:ring-2 focus:ring-violet-500/35",
                          isActive
                            ? "border-violet-500/40 bg-violet-500/15 text-white shadow-[0_0_14px_rgba(139,92,246,0.2)]"
                            : "border-white/[0.1] bg-white/[0.04] text-slate-200 hover:border-violet-500/30 hover:bg-white/[0.07]"
                        )}
                        onClick={() => {
                          const first = TOOLS.find((x) => x.category === cat)?.tool;
                          if (!first) return;
                          setSelected(first);
                          router.replace(`/?tool=${first}`);
                        }}
                      >
                        {t(`category.${cat}.label`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 -mx-2 overflow-x-auto whitespace-nowrap px-2">
                <div className="flex w-max gap-2 pb-1">
                  {TOOLS.filter((x) => x.category === selectedDef.category).map((x) => {
                    const isActive = x.tool === selected;
                    return (
                      <button
                        key={x.tool}
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all duration-300",
                          "focus:outline-none focus:ring-2 focus:ring-violet-500/35",
                          isActive
                            ? "border-violet-500/40 bg-violet-500/15 text-white shadow-[0_0_14px_rgba(139,92,246,0.2)]"
                            : "border-white/[0.1] bg-white/[0.04] text-slate-200 hover:border-violet-500/30 hover:bg-white/[0.07]"
                        )}
                        onClick={() => {
                          setSelected(x.tool);
                          router.replace(`/?tool=${x.tool}`);
                        }}
                      >
                        <span aria-hidden="true">{x.emoji}</span>
                        <span className="max-w-[16rem] truncate">{toolTitle(t, x.tool, x.title)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <ConciergeChat className="mb-5" />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">
                  {t(`category.${selectedDef.category}.label`)}
                </p>
                <h2
                  className={cn(
                    "mt-1 text-pretty text-xl font-semibold tracking-tight",
                    textGradientHero
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true">{selectedDef.emoji}</span>
                    <span>{toolTitle(t, selected, selectedDef.title)}</span>
                  </span>
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {toolDescription(t, selected, selectedDef.description)}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs text-slate-400 backdrop-blur-xl">
                <Sparkles className="size-4 text-indigo-400" />
                {t("home.workspace.hint")}
              </div>
            </div>

            <div className="mt-5">
              <ToolCard tool={selected} showHeader={false} />
            </div>
          </section>
        </section>
      </main>

      <footer className="border-t border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{t("footer.copyright")}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link className="font-medium text-foreground/90 hover:text-foreground transition-colors" href="/login">
              {t("nav.login")}
            </Link>
            <Link className="hover:text-foreground transition-colors" href="/account">
              {t("nav.account")}
            </Link>
            <Link className="hover:text-foreground transition-colors" href="/history">
              {t("nav.history")}
            </Link>
            <Link className="hover:text-foreground transition-colors" href="/pricing">
              {t("nav.pricing")}
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link className="hover:text-foreground transition-colors" href="/privacy">
              {t("nav.privacy")}
            </Link>
            <Link className="hover:text-foreground transition-colors" href="/terms">
              {t("nav.terms")}
            </Link>
            <span className="hidden sm:inline">·</span>
            <span>{t("footer.trust")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

