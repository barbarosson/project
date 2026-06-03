"use client";

import type { ReactNode } from "react";

import { IsendaiLogoMark } from "@/components/isendai-logo-mark";
import {
  FacebookMark,
  GoogleMark,
  InstagramMark,
  OauthProviderMark,
} from "@/components/oauth-brand-icons";
import { useI18n } from "@/i18n/i18n-provider";
import type { OAuthConnectingSlug } from "@/lib/auth/oauth-connecting";
import { heroKicker, pageHeroPanel, pageSubtitle, textGradientHero } from "@/lib/premium-ui";
import { cn } from "@/lib/utils";
import type { Provider } from "@supabase/auth-js";

function ProviderBadge({ slug }: { slug: OAuthConnectingSlug }) {
  const iconClass = "size-6 shrink-0";
  let icon: ReactNode = null;
  if (slug === "google") icon = <GoogleMark className={iconClass} />;
  else if (slug === "facebook") icon = <FacebookMark className={iconClass} />;
  else if (slug === "instagram") icon = <InstagramMark className={iconClass} />;
  else {
    const providerMap: Record<string, Provider> = {
      apple: "apple",
      x: "x",
      linkedin: "linkedin_oidc",
      tiktok: "custom:tiktok" as Provider,
    };
    const p = providerMap[slug];
    if (p) icon = <OauthProviderMark provider={p} className={iconClass} />;
  }
  if (!icon) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] p-2.5",
        "light:border-slate-300/80 light:bg-white/90 light:shadow-sm"
      )}
    >
      {icon}
    </span>
  );
}

function StepRow({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 text-sm transition-colors duration-500",
        done ? "text-violet-200/95 light:text-violet-900" : "text-slate-400 light:text-slate-500",
        active && !done && "text-slate-100 light:text-slate-800"
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
          done &&
            "border-emerald-400/50 bg-emerald-500/20 text-emerald-200 light:border-emerald-600/40 light:bg-emerald-100 light:text-emerald-900",
          active &&
            !done &&
            "border-violet-400/60 bg-violet-500/15 text-violet-100 light:border-violet-500/50 light:bg-violet-100 light:text-violet-900",
          !active &&
            !done &&
            "border-white/10 bg-white/[0.03] light:border-slate-300/70 light:bg-slate-100"
        )}
        aria-hidden
      >
        {done ? "✓" : active ? "…" : ""}
      </span>
      <span className="font-medium">{label}</span>
    </li>
  );
}

export function OAuthRedirectScreen({
  mode,
  providerSlug,
  stepIndex = 0,
}: {
  mode: "outbound" | "inbound";
  providerSlug?: OAuthConnectingSlug | null;
  /** 0 = prepare, 1 = redirect / finish */
  stepIndex?: number;
}) {
  const { t } = useI18n();

  const providerLabel =
    providerSlug != null
      ? t(`auth.connecting.provider.${providerSlug}`)
      : t("auth.connecting.provider.default");

  const title =
    mode === "outbound"
      ? t("auth.connecting.title").replace("{provider}", providerLabel)
      : t("auth.completing.title");

  const subtitle =
    mode === "outbound"
      ? t("auth.connecting.subtitle")
      : t("auth.completing.subtitle");

  const kicker = mode === "outbound" ? t("auth.connecting.kicker") : t("auth.completing.kicker");

  const stepPrepare =
    mode === "outbound" ? t("auth.connecting.stepPrepare") : t("auth.completing.stepSession");
  const stepSecond =
    mode === "outbound" ? t("auth.connecting.stepRedirect") : t("auth.completing.stepFinish");

  return (
    <div
      className={cn(pageHeroPanel, "relative mx-auto mt-0 w-full max-w-lg overflow-hidden p-8 sm:p-10")}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-violet-500/20 blur-3xl light:bg-violet-400/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 size-40 rounded-full bg-fuchsia-500/15 blur-3xl light:bg-fuchsia-300/30"
        aria-hidden
      />

      <div className="relative flex flex-col items-center text-center">
        <span className={heroKicker}>{kicker}</span>

        <div className="relative mt-8 flex size-28 items-center justify-center">
          <span
            className="absolute inset-0 animate-ping rounded-full border border-violet-400/25 opacity-40"
            aria-hidden
          />
          <span
            className="absolute inset-2 animate-pulse rounded-full border border-cyan-400/20"
            aria-hidden
          />
          <span
            className="relative flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50 shadow-[0_0_40px_rgba(139,92,246,0.35)] backdrop-blur-md light:border-violet-200/80 light:bg-white/90 light:shadow-[0_8px_32px_rgba(99,102,241,0.15)]"
          >
            <IsendaiLogoMark className="size-14" />
          </span>
          {mode === "outbound" && providerSlug ? (
            <span className="absolute -bottom-1 -right-1 flex rounded-full ring-4 ring-slate-950/80 light:ring-white">
              <ProviderBadge slug={providerSlug} />
            </span>
          ) : null}
        </div>

        <h1 className={cn("mt-8 text-pretty text-2xl font-bold tracking-tight sm:text-3xl", textGradientHero)}>
          {title}
        </h1>
        <p className={cn(pageSubtitle, "mt-3 max-w-sm text-pretty")}>{subtitle}</p>

        <ol className="mt-8 w-full max-w-xs space-y-3 text-left">
          <StepRow label={stepPrepare} active={stepIndex >= 0} done={stepIndex > 0} />
          <StepRow label={stepSecond} active={stepIndex >= 1} done={false} />
        </ol>

        <p className="mt-8 text-xs leading-relaxed text-slate-400 light:text-slate-500">
          {mode === "outbound" ? t("auth.connecting.hint") : t("auth.completing.hint")}
        </p>
      </div>
    </div>
  );
}
