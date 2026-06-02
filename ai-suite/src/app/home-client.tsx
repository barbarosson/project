"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Bot, Minus, MoveRight, Plus, Sparkles } from "lucide-react";

import { ToolCard } from "@/components/ai-suite/tool-card";
import { PromoCampaignBanner } from "@/components/promo-campaign-banner";
import { SitePageChrome, SitePageHeader } from "@/components/site-page-layout";
import { formatCreditsFromTenths } from "@/lib/credits-units";
import { useI18n } from "@/i18n/i18n-provider";
import { toolDescription, toolTitle } from "@/i18n/tool-i18n";
import { ConciergeChat } from "@/components/concierge-chat";
import {
  TOOLS,
  type ToolCategory,
  type ToolName,
  type ToolPayload,
  getToolDefinition,
} from "@/components/ai-suite/tools";
import { cn } from "@/lib/utils";
import { aiProductsNav } from "@/lib/ai-products-nav-styles";
import { MODULUS_SITE_URL } from "@/lib/modulus-site";
import { siteContainer } from "@/lib/page-layout";
import {
  glassInteractive,
  glassSurface,
  premiumCta,
  sectionGradientBodySm,
  sectionGradientShell,
  sectionGradientSubheading,
  sectionPanelCyan,
  sectionPanelFuchsia,
  sectionPanelViolet,
} from "@/lib/premium-ui";

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

  function scrollToTools() {
    document.getElementById("home-tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const selectedFromUrl = searchParams.get("tool") as ToolName | null;
  const defaultTool = TOOLS[0]?.tool ?? "corporate-whisperer";
  const [selectedState, setSelectedState] = React.useState<ToolName>(
    selectedFromUrl && TOOLS.some((x) => x.tool === selectedFromUrl)
      ? selectedFromUrl
      : defaultTool
  );
  const selected =
    selectedFromUrl && TOOLS.some((x) => x.tool === selectedFromUrl)
      ? selectedFromUrl
      : selectedState;
  const [toolPrefill, setToolPrefill] = React.useState<string | undefined>();
  const [toolPrefillPayload, setToolPrefillPayload] = React.useState<ToolPayload | undefined>();
  const [toolPrefillKey, setToolPrefillKey] = React.useState(0);

  const selectTool = React.useCallback(
    (
      tool: ToolName,
      opts?: { draftText?: string; payload?: ToolPayload; scroll?: boolean; updateUrl?: boolean }
    ) => {
      setSelectedState(tool);
      if (opts?.draftText?.trim()) {
        setToolPrefill(opts.draftText.trim());
        setToolPrefillKey((k) => k + 1);
      }
      if (opts?.payload) {
        setToolPrefillPayload(opts.payload);
        setToolPrefillKey((k) => k + 1);
      } else {
        setToolPrefillPayload(undefined);
      }
      if (opts?.updateUrl !== false) {
        router.replace(`/?tool=${tool}`, { scroll: false });
      }
      if (opts?.scroll) {
        document.getElementById("home-tool-workspace")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    },
    [router]
  );

  function selectToolFromSidebar(tool: ToolName) {
    setToolPrefill(undefined);
    setToolPrefillPayload(undefined);
    selectTool(tool, { scroll: false });
  }
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

  React.useEffect(() => {
    const requestId = searchParams.get("request");
    if (!requestId || requestId.length < 10) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/isendai/request/input?id=${encodeURIComponent(requestId)}`, {
          method: "GET",
          headers: { "accept": "application/json" },
        });
        const json = (await res.json().catch(() => null)) as
          | { payload?: ToolPayload; tool_id?: ToolName; error?: string }
          | null;
        if (cancelled) return;
        if (!res.ok || !json?.payload || !json?.tool_id) return;
        selectTool(json.tool_id, { payload: json.payload, scroll: true, updateUrl: true });
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, selectTool]);

  const demoExamples: { tool: ToolName; key: string }[] = [
    { tool: "corporate-whisperer", key: "corp" },
    { tool: "graceful-quitter", key: "quit" },
    { tool: "awkward-text-fixer", key: "gift" },
    { tool: "corporate-to-caveman-translator", key: "caveman" },
  ];

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot?.signedIn ? authSnapshot.label : null}
      />

      <main className={siteContainer("min-w-0 overflow-x-clip pb-16")}>
        <section
          className={cn(
            "relative overflow-hidden rounded-2xl px-6 py-8 sm:px-10",
            glassInteractive
          )}
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(124,58,237,0.18)_0%,transparent_70%)]" />
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/35 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-violet-100 sm:text-sm">
            <Sparkles className="size-3.5 shrink-0 text-fuchsia-300 sm:size-4" aria-hidden />
            {t("hero.kicker")}
          </p>
          <h1
            className={cn(
              "font-display mt-4 w-full text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl",
              "bg-gradient-to-r from-white via-violet-100 to-cyan-100 bg-clip-text text-transparent"
            )}
          >
            {t("hero.title")}
          </h1>
          <p className="mt-4 w-full min-w-0 text-pretty text-base font-medium leading-relaxed text-slate-200 sm:text-lg">
            {t("hero.subtitle")}
          </p>
          <p className="mt-4 text-sm text-slate-400">
            {t("hero.modulusFamily")}{" "}
            <a
              href={MODULUS_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-violet-200 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              modulusaas.com
            </a>
          </p>
          <PromoCampaignBanner className="mt-6" showPricingLink />
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={scrollToTools}
              className={cn(
                premiumCta,
                "hero-cta-glow min-h-14 w-full rounded-xl px-6 py-4 text-center text-base font-bold sm:w-auto sm:min-w-[min(100%,22rem)] sm:text-lg"
              )}
            >
              {t("hero.cta")}
            </button>
            <Link
              href="/login"
              className={cn(
                premiumCta,
                "min-h-12 w-full rounded-xl px-5 py-3 text-center text-sm font-bold sm:w-auto sm:min-w-[min(100%,12rem)]"
              )}
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/pricing"
              className={cn(
                premiumCta,
                "min-h-12 w-full rounded-xl px-5 py-3 text-center text-sm font-bold sm:w-auto sm:min-w-[min(100%,9rem)]"
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

        <section
          className={cn(
            "relative mt-8 min-w-0 overflow-hidden rounded-3xl border border-violet-500/30 p-4 sm:p-6 lg:p-10",
            "bg-gradient-to-br from-violet-950/50 via-slate-950/80 to-indigo-950/50",
            "shadow-[0_12px_56px_rgba(139,92,246,0.22),inset_0_1px_0_0_rgba(255,255,255,0.08)]",
            "backdrop-blur-xl"
          )}
        >
          <div
            className="pointer-events-none absolute -left-16 top-0 size-48 rounded-full bg-indigo-500/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 -right-12 size-40 rounded-full bg-fuchsia-500/15 blur-3xl"
            aria-hidden
          />
          <div className="relative w-full min-w-0">
            <h2
              className={cn(
                "w-full text-pretty text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl",
                "bg-gradient-to-r from-white via-violet-100 to-cyan-100 bg-clip-text text-transparent"
              )}
            >
              {t("home.aiStack.title")}
            </h2>
            <p className="mt-4 w-full min-w-0 text-pretty text-base font-medium leading-relaxed text-slate-200 sm:text-lg lg:text-[1.125rem] lg:leading-relaxed xl:text-xl">
              {t("home.aiStack.body")}
            </p>
          </div>
        </section>

        <section
          className={cn(
            "relative mt-8 min-w-0 overflow-hidden rounded-3xl border border-cyan-500/25 p-4 sm:p-6 lg:p-10",
            "bg-gradient-to-br from-cyan-950/40 via-slate-950/85 to-violet-950/45",
            "shadow-[0_12px_56px_rgba(34,211,238,0.14),inset_0_1px_0_0_rgba(255,255,255,0.08)]",
            "backdrop-blur-xl"
          )}
          aria-labelledby="home-expert-bots-heading"
        >
          <div
            className="pointer-events-none absolute -left-10 top-8 size-44 rounded-full bg-cyan-500/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-10 right-0 size-52 rounded-full bg-violet-500/15 blur-3xl"
            aria-hidden
          />
          <div className="relative w-full min-w-0">
            <p className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-200 sm:text-sm">
              <Bot className="size-3.5 shrink-0 text-cyan-300 sm:size-4" aria-hidden />
              {t("home.expertBots.kicker")}
            </p>
            <h2
              id="home-expert-bots-heading"
              className={cn(
                "mt-4 w-full text-pretty text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl",
                "bg-gradient-to-r from-white via-cyan-100 to-violet-100 bg-clip-text text-transparent"
              )}
            >
              {t("home.expertBots.title")}
            </h2>
            <p className="mt-4 w-full min-w-0 text-pretty text-base font-medium leading-relaxed text-slate-200 sm:text-lg lg:text-[1.125rem] lg:leading-relaxed xl:text-xl">
              {t("home.expertBots.lead")}
            </p>
            <ul className="mt-6 grid min-w-0 gap-3 sm:grid-cols-3 sm:gap-4">
              {(["home.expertBots.point1", "home.expertBots.point2", "home.expertBots.point3"] as const).map(
                (key) => (
                  <li
                    key={key}
                    className={cn(
                      "rounded-2xl border border-white/[0.08] px-4 py-3.5 text-sm leading-relaxed text-slate-300",
                      glassSurface
                    )}
                  >
                    {t(key)}
                  </li>
                )
              )}
            </ul>
          </div>
        </section>

        <section
          className={cn(
            "relative mt-8 min-w-0 overflow-hidden rounded-3xl border border-violet-500/30 p-4 sm:p-6 lg:p-10",
            "bg-gradient-to-br from-violet-950/50 via-slate-950/80 to-indigo-950/50",
            "shadow-[0_12px_56px_rgba(139,92,246,0.22),inset_0_1px_0_0_rgba(255,255,255,0.08)]",
            "backdrop-blur-xl"
          )}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-fuchsia-500/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-cyan-500/15 blur-3xl"
            aria-hidden
          />
          <div className="relative w-full min-w-0">
            <p className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-200 sm:text-sm">
              <Sparkles className="size-3.5 shrink-0 text-fuchsia-300 sm:size-4" aria-hidden />
              {t("home.demo.before.label")} → {t("home.demo.after.label")}
            </p>
            <h2
              className={cn(
                "mt-4 w-full text-pretty text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl",
                "bg-gradient-to-r from-white via-violet-100 to-cyan-100 bg-clip-text text-transparent"
              )}
            >
              {t("home.demo.title")}
            </h2>
            <p className="mt-4 w-full min-w-0 text-pretty text-base font-medium leading-relaxed text-slate-200 sm:text-lg lg:text-[1.125rem] lg:leading-relaxed xl:text-xl">
              {t("home.demo.subtitle")}
            </p>
          </div>

          <div className="relative mt-8 grid min-w-0 gap-5 lg:grid-cols-2 lg:gap-6">
            {demoExamples.map(({ tool, key }) => (
              <div
                key={tool}
                className={cn(
                  "min-w-0 overflow-hidden rounded-2xl border border-white/[0.1] bg-black/25 p-4 sm:p-5 lg:p-6",
                  "shadow-lg backdrop-blur-md transition-all duration-300",
                  "hover:-translate-y-1 hover:border-violet-400/35 hover:shadow-[0_12px_40px_rgba(139,92,246,0.2)]"
                )}
              >
                <Link
                  href={`/?tool=${tool}`}
                  className="group flex min-w-0 max-w-full items-center gap-2 sm:gap-3 text-base font-semibold text-white sm:text-lg"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 text-lg shadow-inner sm:size-11">
                    <span aria-hidden="true">{getToolDefinition(tool).emoji}</span>
                  </span>
                  <span className="min-w-0 flex-1 truncate group-hover:text-violet-100">
                    {toolTitle(t, tool, getToolDefinition(tool).title)}
                  </span>
                  <ArrowRight className="size-5 shrink-0 text-fuchsia-300 transition-transform group-hover:translate-x-1" />
                </Link>

                <div className="mt-4 grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-stretch">
                  <div className="min-w-0 rounded-xl border border-rose-400/35 bg-gradient-to-br from-rose-500/15 to-rose-950/30 p-3 shadow-[inset_0_1px_0_0_rgba(251,113,133,0.15)] sm:p-4 lg:p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-rose-300 sm:tracking-[0.15em] sm:text-sm">
                      {t("home.demo.before.label")}
                    </p>
                    <p className="mt-2.5 break-words text-sm leading-relaxed text-slate-100 sm:text-base lg:text-[17px]">
                      {t(`home.demo.examples.${key}.before`)}
                    </p>
                  </div>
                  <div className="flex min-w-0 items-center justify-center py-0.5 lg:py-0">
                    <span className="inline-flex size-10 shrink-0 animate-pulse items-center justify-center rounded-full border border-violet-400/40 bg-gradient-to-br from-indigo-500/30 via-violet-500/25 to-fuchsia-500/20 text-violet-100 shadow-[0_0_24px_rgba(139,92,246,0.35)] sm:size-11 lg:size-12">
                      <MoveRight className="size-4 sm:size-5" strokeWidth={2} aria-hidden />
                    </span>
                  </div>
                  <div className="min-w-0 rounded-xl border border-emerald-400/35 bg-gradient-to-br from-emerald-500/15 to-emerald-950/30 p-3 shadow-[inset_0_1px_0_0_rgba(52,211,153,0.15)] sm:p-4 lg:p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-300 sm:tracking-[0.15em] sm:text-sm">
                      {t("home.demo.after.label")}
                    </p>
                    <p className="mt-2.5 break-words text-sm leading-relaxed text-slate-50 sm:text-base lg:text-[17px]">
                      {t(`home.demo.examples.${key}.after`)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          className={cn(
            "relative mt-8 min-w-0 overflow-hidden rounded-3xl border border-violet-500/30 p-4 sm:p-6 lg:p-10",
            "bg-gradient-to-br from-violet-950/50 via-slate-950/80 to-indigo-950/50",
            "shadow-[0_12px_56px_rgba(139,92,246,0.22),inset_0_1px_0_0_rgba(255,255,255,0.08)]",
            "backdrop-blur-xl"
          )}
        >
          <div
            className="pointer-events-none absolute -left-20 top-8 size-52 rounded-full bg-violet-500/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-10 right-0 size-44 rounded-full bg-cyan-500/15 blur-3xl"
            aria-hidden
          />
          <div className="relative w-full min-w-0">
            <h2
              className={cn(
                "w-full text-pretty text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl",
                "bg-gradient-to-r from-white via-violet-100 to-cyan-100 bg-clip-text text-transparent"
              )}
            >
              {t("how.detailed.title")}
            </h2>
            <p className="mt-4 w-full min-w-0 text-pretty text-base font-medium leading-relaxed text-slate-200 sm:text-lg lg:text-[1.125rem] lg:leading-relaxed xl:text-xl">
              {t("how.detailed.subtitle")}
            </p>
          </div>

          <div className="relative mt-8 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {(
              [
                {
                  n: 1,
                  border: "border-violet-400/35",
                  bg: "from-violet-500/15 to-violet-950/30",
                  badge: "bg-violet-500/25 text-violet-100",
                },
                {
                  n: 2,
                  border: "border-fuchsia-400/35",
                  bg: "from-fuchsia-500/15 to-fuchsia-950/30",
                  badge: "bg-fuchsia-500/25 text-fuchsia-100",
                },
                {
                  n: 3,
                  border: "border-cyan-400/35",
                  bg: "from-cyan-500/15 to-cyan-950/30",
                  badge: "bg-cyan-500/25 text-cyan-100",
                },
                {
                  n: 4,
                  border: "border-emerald-400/35",
                  bg: "from-emerald-500/15 to-emerald-950/30",
                  badge: "bg-emerald-500/25 text-emerald-100",
                },
              ] as const
            ).map(({ n, border, bg, badge }) => (
              <div
                key={n}
                className={cn(
                  "min-w-0 rounded-2xl border bg-gradient-to-br p-5 sm:p-6",
                  "shadow-lg backdrop-blur-md transition-all duration-300",
                  "hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(139,92,246,0.2)]",
                  border,
                  bg
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-xl border border-white/10 text-sm font-bold shadow-inner sm:size-10 sm:text-base",
                    badge
                  )}
                  aria-hidden
                >
                  {n}
                </span>
                <p className="mt-4 text-base font-bold text-white sm:text-lg">
                  {t(`how.detailed.${n}.title`)}
                </p>
                <p className="mt-2.5 break-words text-sm leading-relaxed text-slate-200 sm:text-base">
                  {t(`how.detailed.${n}.body`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="home-tools" className={cn("mt-8 scroll-mt-24", sectionGradientShell)}>
          <div
            className="pointer-events-none absolute -right-16 top-0 size-52 rounded-full bg-fuchsia-500/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-16 size-48 rounded-full bg-violet-500/15 blur-3xl"
            aria-hidden
          />

          <div className="relative grid min-w-0 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          {/* Left: tool list */}
          <aside className={cn("hidden min-w-0 p-5 lg:block", sectionPanelViolet)}>
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
                            onClick={() => selectToolFromSidebar(x.tool)}
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
          <section className={cn("min-w-0 overflow-hidden p-4 sm:p-6", sectionPanelFuchsia)}>
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
                          selectToolFromSidebar(first);
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
                        onClick={() => selectToolFromSidebar(x.tool)}
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

            <ConciergeChat
              className={cn(
                "mb-5 hover:translate-y-0",
                sectionPanelCyan,
                "border-cyan-400/35 from-cyan-500/15 to-cyan-950/30"
              )}
              onOpenTool={(tool, opts) =>
                selectTool(tool, {
                  draftText: opts?.draftText,
                  scroll: opts?.scroll ?? true,
                })
              }
            />
            <div
              id="home-tool-workspace"
              className="flex flex-wrap items-start justify-between gap-4 scroll-mt-28"
            >
              <div className="min-w-0">
                <p className={aiProductsNav.workspaceCategory}>
                  {t(`category.${selectedDef.category}.label`)}
                </p>
                <h2 className={cn("mt-2", sectionGradientSubheading)}>
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true">{selectedDef.emoji}</span>
                    <span>{toolTitle(t, selected, selectedDef.title)}</span>
                  </span>
                </h2>
                <p className={cn("mt-3 max-w-2xl", sectionGradientBodySm)}>
                  {toolDescription(t, selected, selectedDef.description)}
                </p>
              </div>
              <div className="font-sans inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-100 sm:text-sm">
                <Sparkles className="size-4 shrink-0 text-fuchsia-300" aria-hidden />
                {t("home.workspace.hint")}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/10 to-slate-950/40 p-1 shadow-lg backdrop-blur-md sm:p-2">
              <ToolCard
                key={`${selected}-${toolPrefillKey}`}
                tool={selected}
                showHeader={false}
                initialText={toolPrefill}
                initialPayload={toolPrefillPayload}
              />
            </div>
          </section>
          </div>
        </section>
      </main>

    </SitePageChrome>
  );
}

