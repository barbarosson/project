"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import { ToolCard } from "@/components/ai-suite/tool-card";
import { AuroraBackground } from "@/components/aurora-background";
import { LanguageSwitcher } from "@/components/language-switcher";
import { IsendaiLogo } from "@/components/isendai-logo";
import { useI18n } from "@/i18n/i18n-provider";
import { ModelSwitcher } from "@/components/model-switcher";
import {
  CATEGORY_META,
  TOOLS,
  type ToolCategory,
  type ToolName,
  getToolDefinition,
} from "@/components/ai-suite/tools";
import { cn } from "@/lib/utils";

export function HomeClient() {
  const { t } = useI18n();

  const categories: ToolCategory[] = ["work-career", "crisis-money", "social-dating"];
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedFromUrl = searchParams.get("tool") as ToolName | null;
  const defaultTool = TOOLS[0]?.tool ?? "corporate-whisperer";
  const [selected, setSelected] = React.useState<ToolName>(
    selectedFromUrl && TOOLS.some((x) => x.tool === selectedFromUrl)
      ? selectedFromUrl
      : defaultTool
  );

  const selectedDef = getToolDefinition(selected);

  return (
    <div className="min-h-full bg-background">
      <AuroraBackground />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-5">
        <div className="flex items-center gap-2">
          <IsendaiLogo withWordmark />
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <ModelSwitcher className="hidden sm:inline-flex" />
          <ModeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16">
        <section className="relative overflow-hidden rounded-2xl border bg-card/70 px-6 py-8 shadow-sm backdrop-blur sm:px-10">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)_/_0.16)_0%,transparent_70%)]" />
          <p className="text-sm font-medium text-muted-foreground">{t("hero.kicker")}</p>
          <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight sm:text-4xl">
            {t("hero.title")}
          </h1>
          <p className="mt-3 max-w-3xl text-balance text-sm text-muted-foreground sm:text-base">
            {t("hero.subtitle")}
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left: tool list */}
          <aside className="rounded-2xl border bg-card/70 p-4 shadow-sm backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">AI Products</p>
              <span className="text-xs text-muted-foreground">{TOOLS.length}</span>
            </div>

            <div className="grid gap-4">
              {categories.map((cat) => (
                <div key={cat}>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    {CATEGORY_META[cat].label}
                  </p>
                  <div className="grid gap-1">
                    {TOOLS.filter((x) => x.category === cat).map((x) => {
                      const isActive = x.tool === selected;
                      return (
                        <button
                          key={x.tool}
                          type="button"
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                            isActive
                              ? "border-primary/30 bg-primary/10"
                              : "border-border/60 bg-background/50 hover:bg-accent/40"
                          )}
                          onClick={() => {
                            setSelected(x.tool);
                            router.replace(`/?tool=${x.tool}`);
                          }}
                        >
                          <span className="truncate">{x.label}</span>
                          <ArrowRight className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Right: workspace */}
          <section className="rounded-2xl border bg-card/70 p-4 shadow-sm backdrop-blur sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">
                  {CATEGORY_META[selectedDef.category].label}
                </p>
                <h2 className="mt-1 text-pretty text-xl font-semibold tracking-tight">
                  {selectedDef.label}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedDef.description}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                <Sparkles className="size-4" />
                Paste → Generate → Copy
              </div>
            </div>

            <div className="mt-4 sm:hidden">
              <ModelSwitcher />
            </div>

            <div className="mt-5">
              <ToolCard tool={selected} showHeader={false} />
            </div>
          </section>
        </section>
      </main>

      <footer className="border-t bg-background/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{t("footer.copyright")}</p>
          <p className="text-sm text-muted-foreground">{t("footer.trust")}</p>
        </div>
      </footer>
    </div>
  );
}

