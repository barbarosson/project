"use client";

import * as React from "react";
import Link from "next/link";
import { Copy, Gift, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/i18n/i18n-provider";
import type { RewardsPayload } from "@/lib/referrals/load-rewards-payload";
import { REFERRAL_BONUS_CREDITS_WHOLE } from "@/lib/referrals/constants";
import {
  glassInteractive,
  glassSurface,
  premiumCta,
  sectionGradientHeading,
  sectionGradientShell,
} from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

type RewardsPayloadView = RewardsPayload;

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function RewardsDashboardClient({
  initialData = null,
}: {
  initialData?: RewardsPayloadView | null;
}) {
  const { t } = useI18n();
  const [data, setData] = React.useState<RewardsPayloadView | null>(initialData);
  const [loading, setLoading] = React.useState(initialData == null);

  const shareMessage = React.useMemo(() => {
    if (!data?.invite_url) return "";
    return t("referrals.shareMessage").replace("{link}", data.invite_url);
  }, [data?.invite_url, t]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/rewards", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });
        const json = (await res.json()) as RewardsPayloadView & { error?: string; code?: string };
        if (!cancelled && res.ok) {
          setData(json);
        } else if (!cancelled && !initialData) {
          setData(null);
          if (json.error) {
            toast.error(json.error);
          }
        }
      } catch {
        if (!cancelled && !initialData) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialData]);

  async function copyLink() {
    if (!data?.invite_url) return;
    try {
      await navigator.clipboard.writeText(data.invite_url);
      toast.success(t("referrals.copySuccess"));
    } catch {
      toast.error(t("referrals.copyFailed"));
    }
  }

  function openShare(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const progressPct =
    data && data.friends_invited > 0
      ? Math.min(100, Math.round((data.credits_earned / (data.friends_invited * REFERRAL_BONUS_CREDITS_WHOLE)) * 100))
      : 0;

  return (
    <div className="space-y-8">
      <section className={cn(sectionGradientShell)}>
        <div className="relative flex items-start gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl border border-fuchsia-400/35 bg-fuchsia-500/15 text-2xl">
            <Gift className="size-6 text-fuchsia-200" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className={sectionGradientHeading}>{t("referrals.pageTitle")}</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-200 sm:text-base">
              {t("referrals.pageLead").replace("{n}", String(REFERRAL_BONUS_CREDITS_WHOLE))}
            </p>
          </div>
        </div>
      </section>

      <section className={cn(glassSurface, "p-5 sm:p-6")}>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-violet-200">
          {t("referrals.inviteLinkHeading")}
        </h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-400">{t("referrals.loading")}</p>
        ) : data ? (
          <>
            <p className="mt-4 break-all rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 font-mono text-sm text-violet-100">
              {data.invite_url}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={premiumCta} onClick={() => void copyLink()}>
                <Copy className="size-4" aria-hidden />
                {t("referrals.copyLink")}
              </button>
              <button
                type="button"
                className={cn(premiumCta, "bg-emerald-600/80 hover:shadow-emerald-500/20")}
                onClick={() =>
                  openShare(
                    `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
                  )
                }
              >
                <MessageCircle className="size-4" aria-hidden />
                {t("referrals.shareWhatsApp")}
              </button>
              <button
                type="button"
                className={cn(premiumCta, "bg-slate-700/80")}
                onClick={() =>
                  openShare(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`
                  )
                }
              >
                <XIcon className="size-4" />
                {t("referrals.shareX")}
              </button>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-rose-300">{t("referrals.loadError")}</p>
        )}
      </section>

      <section className={cn(glassInteractive, "p-5 sm:p-6")}>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-violet-200">
          {t("referrals.statsHeading")}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {t("referrals.friendsInvited")}
            </p>
            <p className="mt-1 text-3xl font-bold text-white">{data?.friends_invited ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {t("referrals.creditsEarned")}
            </p>
            <p className="mt-1 text-3xl font-bold text-amber-200">
              {data?.credits_earned ?? 0}
              <span className="ml-1 text-base font-semibold text-amber-100/80">🪙</span>
            </p>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs text-slate-400">
            <span>{t("referrals.progressLabel")}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-all duration-500"
              style={{ width: `${Math.max(progressPct, data?.friends_invited ? 8 : 0)}%` }}
            />
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-400">{t("referrals.statsHint")}</p>
      </section>

      <p className="text-center text-sm text-slate-400">
        <Link href="/pricing" className="font-medium text-violet-300 hover:text-violet-200">
          {t("referrals.topUpLink")} →
        </Link>
      </p>
    </div>
  );
}
