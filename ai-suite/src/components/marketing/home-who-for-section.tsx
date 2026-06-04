"use client";

import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

import { getToolDefinition } from "@/components/ai-suite/tools";
import { HOME_AUDIENCE_SEGMENTS } from "@/lib/marketing/home-audiences";
import { useI18n } from "@/i18n/i18n-provider";
import {
  glassInteractive,
  glassSurface,
  heroKicker,
  marketingBody,
  marketingHeading,
  premiumCta,
} from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

export function HomeWhoForSection() {
  const { t } = useI18n();

  return (
    <section
      className={cn("relative mt-8 overflow-hidden", glassInteractive, "rounded-2xl px-6 py-8 sm:px-10")}
      aria-labelledby="home-who-for-heading"
    >
      <div
        className="pointer-events-none absolute -left-12 top-0 size-40 rounded-full bg-violet-500/15 blur-3xl light:bg-violet-400/20"
        aria-hidden
      />
      <p className={heroKicker}>
        <Users className="size-3.5 shrink-0 text-violet-300 sm:size-4 light:text-violet-800" aria-hidden />
        {t("home.whoFor.kicker")}
      </p>
      <h2 id="home-who-for-heading" className={cn("mt-4 text-pretty", marketingHeading)}>
        {t("home.whoFor.title")}
      </h2>
      <p className={cn("mt-3 max-w-3xl text-pretty", marketingBody)}>{t("home.whoFor.lead")}</p>

      <ul className="mt-8 grid min-w-0 gap-4 sm:grid-cols-3 sm:gap-5">
        {HOME_AUDIENCE_SEGMENTS.map((seg) => {
          const titleKey = `home.whoFor.${seg.id}.title` as const;
          const painKey = `home.whoFor.${seg.id}.pain` as const;
          const toolNameKey = `home.whoFor.${seg.id}.toolName`;
          const toolBlurbKey = `home.whoFor.${seg.id}.toolBlurb`;
          const def = getToolDefinition(seg.tool);
          return (
            <li
              key={seg.id}
              className={cn(
                "flex min-w-0 flex-col rounded-2xl border border-violet-500/20 p-6 sm:p-7",
                glassSurface
              )}
            >
              <h3
                className={cn(
                  "font-display text-xl font-extrabold uppercase leading-tight tracking-wide",
                  "text-violet-50 sm:text-2xl",
                  "light:text-violet-950"
                )}
              >
                {t(titleKey)}
              </h3>
              <p className="mt-3 flex-1 text-base leading-relaxed text-slate-200 light:text-slate-700">
                {t(painKey)}
              </p>
              <div className="mt-6 border-t border-white/[0.1] pt-5 light:border-slate-200">
                <p className="text-sm font-bold uppercase tracking-wider text-violet-200 light:text-violet-800">
                  {t("home.whoFor.tryTool")}
                </p>
                <p className="mt-2 text-lg font-bold leading-snug text-white light:text-slate-900">
                  {t(toolNameKey) !== toolNameKey ? t(toolNameKey) : def.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300 light:text-slate-600">
                  {t(toolBlurbKey)}
                </p>
                <Link
                  href={`/tool/${seg.tool}`}
                  className={cn(
                    premiumCta,
                    "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold sm:w-auto"
                  )}
                >
                  {t("home.whoFor.openTool")}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
