"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { ToolCard } from "@/components/ai-suite/tool-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuroraBackground } from "@/components/aurora-background";
import { LanguageSwitcher } from "@/components/language-switcher";
import { IsendaiLogo } from "@/components/isendai-logo";
import { useI18n } from "@/i18n/i18n-provider";
import { CATEGORY_META, TOOLS, type ToolCategory } from "@/components/ai-suite/tools";

export function HomeClient() {
  const { t } = useI18n();

  const categories: ToolCategory[] = ["work-career", "crisis-money", "social-dating"];

  return (
    <div className="min-h-full bg-background">
      <AuroraBackground />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-5">
        <div className="flex items-center gap-2">
          <IsendaiLogo withWordmark />
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <ModeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16">
        <section className="relative overflow-hidden rounded-2xl border bg-card/80 px-6 py-14 shadow-sm backdrop-blur sm:px-10">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)_/_0.18)_0%,transparent_70%)]" />
          <p className="text-sm font-medium text-muted-foreground">
            {t("hero.kicker")}
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            {t("hero.subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              {t("hero.badge.noSubscription")}
            </span>
            <span className="rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              {t("hero.badge.noSignups")}
            </span>
            <span className="rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              {t("hero.badge.payPerUse")}
            </span>
            <span className="rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              {t("hero.badge.noStore")}
            </span>
          </div>

          <div className="mt-6 sm:hidden">
            <LanguageSwitcher />
          </div>
        </section>

        <section className="mt-10 grid gap-10">
          <div>
            <div className="mb-4">
              <h2 className="text-pretty text-xl font-semibold tracking-tight">
                {t("section.tools.title")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("section.tools.subtitle")}
              </p>
            </div>

            <Tabs defaultValue="work-career" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-3">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="h-10 rounded-md border bg-card/80 backdrop-blur"
                  >
                    {CATEGORY_META[cat].label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((cat) => (
                <TabsContent key={cat} value={cat}>
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">
                      {CATEGORY_META[cat].description}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {TOOLS.filter((t) => t.category === cat).map((tool) => (
                      <ToolCard key={tool.tool} tool={tool.tool} />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="grid gap-4 rounded-2xl border bg-card/80 p-6 shadow-sm backdrop-blur sm:grid-cols-3 sm:gap-6 sm:p-8">
            <div>
              <p className="text-sm font-semibold">{t("how.1.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("how.1.body")}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">{t("how.2.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("how.2.body")}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">{t("how.3.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("how.3.body")}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-pretty text-xl font-semibold tracking-tight">
              {t("products.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("products.subtitle")}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold">{t("products.corp.title")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  “{t("products.corp.slogan")}”
                </p>
              </div>
              <div className="rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold">{t("products.cover.title")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  “{t("products.cover.slogan")}”
                </p>
              </div>
              <div className="rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold">{t("products.dating.title")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  “{t("products.dating.slogan")}”
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold">{t("faq.q1")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("faq.a1")}</p>
            </div>
            <div className="rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold">{t("faq.q2")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("faq.a2")}</p>
            </div>
            <div className="rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold">{t("faq.q3")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("faq.a3")}</p>
            </div>
          </div>
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

