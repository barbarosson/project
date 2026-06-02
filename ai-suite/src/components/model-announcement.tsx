"use client";

import * as React from "react";
import { Sparkles, X } from "lucide-react";

import { useI18n } from "@/i18n/i18n-provider";
import {
  announcementModelName,
  LATEST_MODEL_ANNOUNCEMENT,
  modelAnnouncementStorageKey,
} from "@/models/model-announcement";
import { cn } from "@/lib/utils";
import { glassSurface } from "@/lib/premium-ui";

const TIER_LABEL_KEY = {
  "fast-ai": "modelSwitcher.fast",
  "pro-ai": "modelSwitcher.pro",
  "genius-ai": "modelSwitcher.genius",
} as const;

export function ModelAnnouncement() {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      if (localStorage.getItem(modelAnnouncementStorageKey()) === "1") return;
    } catch {
      // If storage is unavailable, still show once per session.
    }
    const timer = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = React.useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(modelAnnouncementStorageKey(), "1");
    } catch {
      // ignore
    }
  }, []);

  if (!open) return null;

  const modelName = announcementModelName();
  const tierName = t(TIER_LABEL_KEY[LATEST_MODEL_ANNOUNCEMENT.tier]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 right-4 z-[60] w-[min(92vw,22rem)] rounded-2xl border border-violet-400/30 p-4 shadow-[0_16px_48px_rgba(124,58,237,0.28)]",
        glassSurface
      )}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("announce.dismiss")}
        className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-center gap-2">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-gradient-to-br from-violet-500/25 to-fuchsia-500/15 text-fuchsia-200">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <span className="inline-flex items-center rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-fuchsia-200">
          {t("announce.newModel.badge")}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold text-white">
        {t("announce.newModel.title").replace("{model}", modelName)}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-300">
        {t("announce.newModel.body")
          .replace("{model}", modelName)
          .replace("{tier}", tierName)}
      </p>

      <button
        type="button"
        onClick={dismiss}
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-100 transition-colors hover:bg-violet-500/25"
      >
        {t("announce.dismiss")}
      </button>
    </div>
  );
}
