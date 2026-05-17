"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Minus, MoveRight, Plus, Sparkles } from "lucide-react";

import { ToolCard } from "@/components/ai-suite/tool-card";
import { IsendaiLogo } from "@/components/isendai-logo";
import { formatCreditsFromTenths } from "@/lib/credits-units";
import { useI18n } from "@/i18n/i18n-provider";
import { toolDescription, toolTitle } from "@/i18n/tool-i18n";
import { ConciergeChat } from "@/components/concierge-chat";
import { AuthStatus } from "@/components/auth-status";
import { CreditsNav } from "@/components/credits-nav";
import {
  TOOLS,
  type ToolCategory,
  type ToolName,
  getToolDefinition,
} from "@/components/ai-suite/tools";
import { cn } from "@/lib/utils";
import { aiProductsNav } from "@/lib/ai-products-nav-styles";
import { siteContainer } from "@/lib/page-layout";
import { glassInteractive, glassSurface, premiumCta, textGradientHero } from "@/lib/premium-ui";

import type { HomeCreditsSnapshot } from "@/app/home-credits-snapshot";
import type { ServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";

export function HomeClient({
  creditsSnapshot,
  authSnapshot,
}: {
  creditsSnapshot: HomeCreditsSnapshot | null;
  authSnapshot?: ServerAuthSnapshot;
}) {
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
    <div className="min-h-full min-w-0 overflow-x-clip">
      <header
        className={siteContainer(
          "flex flex-wrap items-start justify-between gap-3 py-4 sm:items-center sm:py-5"
        )}
      >
        <div className="flex min-w-0 max-w-[min(100%,20rem)] flex-1 items-center sm:max-w-none">
          <IsendaiLogo
            withWordmark
            className="min-w-0 max-w-full gap-1.5 sm:gap-2 md:gap-3"
            iconClassName="size-9 shrink-0 sm:size-10 md:size-12 lg:size-14"
            wordmarkClassName="truncate text-xl sm:text-2xl md:text-3xl lg:text-4xl"
          />
        </div>
        <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-1.5 sm:w-auto sm:gap-2">
          <CreditsNav />
          <AuthStatus
            className="shrink-0"
            initialSignedInLabel={authSnapshot?.signedIn ? authSnapshot.label : null}
          />
        </div>
      </header>

      <main className={siteContainer("pb-16")}>
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
          <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/login"
              className={cn(
                premiumCta,
                "min-h-12 w-full rounded-xl px-5 py-3.5 text-center text-sm font-semibold sm:text-base"
              )}
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/pricing"
              className={cn(
                "flex min-h-12 w-full items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04] px-5 py-3.5 text-center text-sm font-semibold text-slate-100 backdrop-blur-xl transition-all duration-300 hover:border-violet-500/35 hover:bg-white/[0.07] active:scale-[0.98] sm:text-base"
              )}
            >
              {t("nav.pricing")}
            </Link>
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
                  .replace("{credits}", formatCreditsFromTenths(creditsSnapshot.balance))
                  .replace("{max}", String(creditsSnapshot.maxVersions))
                  .replace("{scope}", t("home.creditsScopeUser"))}
              </p>
              {creditsSnapshot.balance === 0 ? (
                <p className="mt-2 text-[11px] leading-relaxed text-amber-200/90 sm:text-xs">
                  {t("growth.zeroCreditsHint")}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className={cn("mt-6 rounded-2xl p-5 sm:p-6", glassSurface)}>
          <h2 className={cn("text-base font-semibold tracking-tight sm:text-lg", textGradientHero)}>
            {t("home.aiStack.title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{t("home.aiStack.body")}</p>
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

        <section className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          {/* Left: tool list */}
          <aside className={cn("hidden min-w-0 rounded-2xl p-5 lg:block", glassSurface)}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className={aiProductsNav.sidebarTitle}>{t("home.sidebar.title")}</p>
              <span className={aiProductsNav.countBadge}>{TOOLS.length}</span>
            </div>

            <div className="grid gap-3">
              {categories.map((cat) => (
                <div key={cat}>
                  <button
                    type="button"
                    className={cn(
                      aiProductsNav.categoryRow,
                      expanded[cat] && aiProductsNav.categoryRowOpen
                    )}
                    aria-expanded={expanded[cat]}
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }))
                    }
                  >
                    <span
                      className={cn(
                        aiProductsNav.categoryLabel,
                        expanded[cat] && aiProductsNav.categoryLabelOpen
                      )}
                    >
                      {t(`category.${cat}.label`)}
                    </span>
                    <span className={aiProductsNav.categoryToggle}>
                      {expanded[cat] ? <Minus className="size-4" /> : <Plus className="size-4" />}
                    </span>
                  </button>

                  {expanded[cat] ? (
                    <div className={cn(aiProductsNav.toolList, "mt-2")}>
                      {TOOLS.filter((x) => x.category === cat).map((x) => {
                        const isActive = x.tool === selected;
                        return (
                          <button
                            key={x.tool}
                            type="button"
                            className={aiProductsNav.toolRow(isActive)}
                            onClick={() => {
                              setSelected(x.tool);
                              router.replace(`/?tool=${x.tool}`);
                            }}
                          >
                            <span className="flex min-w-0 flex-1 items-center gap-3">
                              <span
                                className={cn(
                                  aiProductsNav.toolEmoji,
                                  isActive && aiProductsNav.toolEmojiActive
                                )}
                                aria-hidden="true"
                              >
                                {x.emoji}
                              </span>
                              <span className="truncate">{toolTitle(t, x.tool, x.title)}</span>
                            </span>
                            <ArrowRight
                              className={cn(
                                "size-5 shrink-0 transition-transform duration-300",
                                isActive
                                  ? "translate-x-0.5 text-violet-300"
                                  : "text-indigo-400/80 group-hover:translate-x-0.5 group-hover:text-violet-300"
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
          <section className={cn("min-w-0 overflow-hidden rounded-2xl p-4 sm:p-6", glassInteractive)}>
            <div className="mb-4 min-w-0 lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <p className={aiProductsNav.sidebarTitle}>{t("home.sidebar.title")}</p>
                <span className={aiProductsNav.countBadge}>{TOOLS.length}</span>
              </div>
              <div className="mt-3 -mx-1 max-w-full overflow-x-auto overscroll-x-contain px-1">
                <div className="flex w-max max-w-none gap-2 pb-1">
                  {categories.map((cat) => {
                    const isActive = selectedDef.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={aiProductsNav.chip(isActive)}
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

              <div className="mt-3 -mx-1 max-w-full overflow-x-auto overscroll-x-contain px-1">
                <div className="flex w-max max-w-none gap-2 pb-1">
                  {TOOLS.filter((x) => x.category === selectedDef.category).map((x) => {
                    const isActive = x.tool === selected;
                    return (
                      <button
                        key={x.tool}
                        type="button"
                        className={aiProductsNav.chip(isActive)}
                        onClick={() => {
                          setSelected(x.tool);
                          router.replace(`/?tool=${x.tool}`);
                        }}
                      >
                        <span className="text-lg leading-none" aria-hidden="true">
                          {x.emoji}
                        </span>
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
                <p className={aiProductsNav.workspaceCategory}>
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
        <div className={siteContainer("flex flex-col gap-3 py-10 sm:flex-row sm:items-center sm:justify-between")}>
          <p className="text-sm text-muted-foreground">{t("footer.copyright")}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link className="font-medium text-foreground/90 hover:text-foreground transition-colors" href="/login">
              {t("nav.login")}
            </Link>
            <Link className="hover:text-foreground transition-colors" href="/account">
              {t("nav.account")}
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

