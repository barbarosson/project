"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bot, Check, Copy, Gift, Percent, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/i18n/i18n-provider";
import {
  PROMO_CODE_ISEND101,
  PROMO_ISEND101_DISCOUNT_PERCENT,
} from "@/lib/promo";
import { WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE } from "@/lib/welcome-bonus/constants";
import { glassSurface, interactiveClick, premiumCta } from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "isendai-login-onboarding-v1";
const SLIDE_COUNT = 4;

const SLIDE_ICONS = [Sparkles, Bot, Gift, Percent] as const;

function dismissOnboarding() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function LoginOnboardingCarousel() {
  const { t } = useI18n();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const [copied, setCopied] = React.useState(false);
  const touchStartX = React.useRef<number | null>(null);

  React.useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const credits = String(WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE);
  const slides = React.useMemo(
    () => [
      {
        title: t("loginOnboarding.slide1.title"),
        body: t("loginOnboarding.slide1.body"),
      },
      {
        title: t("loginOnboarding.slide2.title"),
        body: t("loginOnboarding.slide2.body"),
      },
      {
        title: t("loginOnboarding.slide3.title").replace("{credits}", credits),
        body: t("loginOnboarding.slide3.body").replace("{credits}", credits),
      },
      {
        title: t("loginOnboarding.slide4.title"),
        body: t("loginOnboarding.slide4.body")
          .replace("{code}", PROMO_CODE_ISEND101)
          .replace("{percent}", String(PROMO_ISEND101_DISCOUNT_PERCENT)),
      },
    ],
    [t, credits]
  );

  function close() {
    dismissOnboarding();
    setOpen(false);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(PROMO_CODE_ISEND101);
      setCopied(true);
      toast.success(t("promo.isend101.copied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("promo.isend101.copyFailed"));
    }
  }

  function goNext() {
    setIndex((i) => Math.min(i + 1, SLIDE_COUNT - 1));
  }

  function goBack() {
    setIndex((i) => Math.max(i - 1, 0));
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    const delta = end - start;
    if (Math.abs(delta) < 48) return;
    if (delta < 0) goNext();
    else goBack();
  }

  if (!mounted || !open) return null;

  const isLast = index === SLIDE_COUNT - 1;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        aria-label={t("loginOnboarding.skip")}
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("loginOnboarding.ariaLabel")}
        className={cn(
          "relative isolate z-[101] flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/[0.12] sm:rounded-3xl",
          glassSurface,
          "max-h-[min(92vh,36rem)] shadow-2xl"
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="onboarding-silhouette-bg pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[min(42%,11rem)]"
          aria-hidden
        />
        <div className="relative z-[1] flex items-center justify-between gap-2 border-b border-white/[0.08] px-4 py-3 light:border-slate-300/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-300 light:text-violet-800">
            {index + 1} / {SLIDE_COUNT}
          </p>
          <button
            type="button"
            onClick={close}
            className={cn(
              interactiveClick,
              "rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:text-white light:hover:text-slate-900"
            )}
          >
            {t("loginOnboarding.skip")}
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((slide, i) => {
              const Icon = SLIDE_ICONS[i] ?? Sparkles;
              return (
                <div
                  key={i}
                  className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6"
                  aria-hidden={i !== index}
                >
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                      i === 3
                        ? "bg-amber-500/20 text-amber-200 light:bg-amber-100 light:text-amber-900"
                        : "bg-violet-500/20 text-violet-200 light:bg-violet-100 light:text-violet-900"
                    )}
                    aria-hidden
                  >
                    <Icon className="size-6" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <h2 className="text-lg font-bold leading-snug text-white light:text-slate-900 sm:text-xl">
                      {slide.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-slate-300 light:text-slate-700 sm:text-base">
                      {slide.body}
                    </p>
                  </div>
                  {i === 3 ? (
                    <div
                      className={cn(
                        "mt-1 rounded-xl border border-amber-400/35 bg-amber-500/10 p-3 light:border-amber-500/45 light:bg-amber-50/90"
                      )}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/90 light:text-amber-900">
                        {t("promo.isend101.codeLabel")}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <code className="font-mono text-xl font-bold tracking-wider text-amber-100 light:text-amber-950">
                          {PROMO_CODE_ISEND101}
                        </code>
                        <button
                          type="button"
                          onClick={() => void copyCode()}
                          className={cn(
                            interactiveClick,
                            "inline-flex items-center gap-1 rounded-lg border border-white/[0.12] bg-white/[0.06] px-2.5 py-1.5 text-xs font-semibold text-slate-100 light:border-slate-300 light:bg-white light:text-slate-800"
                          )}
                        >
                          {copied ? (
                            <Check className="size-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                          {copied ? t("promo.isend101.copiedShort") : t("promo.isend101.copy")}
                        </button>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-400 light:text-slate-600">
                        {t("loginOnboarding.slide4.promoHint")}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-[1] flex flex-col gap-3 border-t border-white/[0.08] px-4 py-4 light:border-slate-300/60 sm:px-6">
          <div className="flex justify-center gap-1.5" aria-hidden>
            {slides.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-violet-400 light:bg-violet-600" : "w-1.5 bg-white/25 light:bg-slate-300"
                )}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {index > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className={cn(
                  interactiveClick,
                  "rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 light:border-slate-300 light:bg-white light:text-slate-800"
                )}
              >
                {t("loginOnboarding.back")}
              </button>
            ) : null}
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {isLast ? (
                <>
                  <Link
                    href="/pricing"
                    onClick={close}
                    className={cn(
                      interactiveClick,
                      "rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-violet-200 light:border-slate-300 light:bg-white light:text-violet-800"
                    )}
                  >
                    {t("loginOnboarding.viewPricing")}
                  </Link>
                  <button type="button" onClick={close} className={premiumCta}>
                    {t("loginOnboarding.start")}
                  </button>
                </>
              ) : (
                <button type="button" onClick={goNext} className={premiumCta}>
                  {t("loginOnboarding.next")}
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={close}
          className={cn(
            interactiveClick,
            "absolute right-3 top-3 z-[2] rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white light:hover:text-slate-900",
            "max-sm:hidden"
          )}
          aria-label={t("loginOnboarding.skip")}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}
