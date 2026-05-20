"use client";

import * as React from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

import { useI18n } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import { glassSurface, interactiveClick } from "@/lib/premium-ui";

export type FeedbackRating = "up" | "down";

type Props = {
  /** Changes when the user selects another version — resets local vote UI. */
  feedbackKey: string;
  toolId: string;
  originalText: string;
  aiResponse: string;
  modelUsed: string;
  requestId?: string | null;
};

export function AiFeedbackBar({
  feedbackKey,
  toolId,
  originalText,
  aiResponse,
  modelUsed,
  requestId,
}: Props) {
  const { t } = useI18n();
  const [submitted, setSubmitted] = React.useState<FeedbackRating | null>(null);
  const [animating, setAnimating] = React.useState<FeedbackRating | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(rating: FeedbackRating) {
    if (submitted || busy) return;
    setAnimating(rating);
    setBusy(true);

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          toolId,
          originalText,
          aiResponse,
          rating,
          modelUsed,
          requestId: requestId ?? undefined,
        }),
      });
    } catch {
      /* UX: still thank the user; ops can rely on server logs */
    }

    window.setTimeout(() => {
      setSubmitted(rating);
      setAnimating(null);
      setBusy(false);
    }, 280);
  }

  return (
    <div
      key={feedbackKey}
      className={cn(
        "mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] px-4 py-3",
        glassSurface
      )}
      role="group"
      aria-label={t("success.feedback.question")}
    >
      {submitted ? (
        <p className="text-sm font-medium text-violet-200/95 opacity-100 transition-opacity duration-300">
          {t("success.feedback.thanks")}
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-300">{t("success.feedback.question")}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              aria-label={t("success.feedback.thumbsUpAria")}
              onClick={() => void submit("up")}
              className={cn(
                interactiveClick,
                "inline-flex size-10 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.05] text-emerald-400 backdrop-blur-xl",
                "hover:border-emerald-400/40 hover:bg-emerald-500/10",
                animating === "up" && "scale-110 animate-bounce"
              )}
            >
              <ThumbsUp className="size-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              disabled={busy}
              aria-label={t("success.feedback.thumbsDownAria")}
              onClick={() => void submit("down")}
              className={cn(
                interactiveClick,
                "inline-flex size-10 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.05] text-rose-400 backdrop-blur-xl",
                "hover:border-rose-400/40 hover:bg-rose-500/10",
                animating === "down" && "scale-110 animate-bounce"
              )}
            >
              <ThumbsDown className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
