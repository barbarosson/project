"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { ConciergeChat } from "@/components/concierge-chat";
import type { ToolName } from "@/components/ai-suite/tools";
import { useI18n } from "@/i18n/i18n-provider";
import { interactiveClick } from "@/lib/premium-ui";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

const CONCIERGE_DRAFT_KEY = "ai-suite:concierge-draft";

export function FloatingConciergeWidget() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useIsClient();
  const [open, setOpen] = React.useState(false);

  const handleOpenTool = React.useCallback(
    (tool: ToolName, opts?: { draftText?: string; scroll?: boolean }) => {
      if (opts?.draftText?.trim()) {
        try {
          sessionStorage.setItem(
            CONCIERGE_DRAFT_KEY,
            JSON.stringify({ tool, draftText: opts.draftText.trim() })
          );
        } catch {
          /* ignore */
        }
      }
      setOpen(false);
      const target = `/?tool=${encodeURIComponent(tool)}`;
      if (pathname === "/") {
        router.replace(target, { scroll: false });
        if (opts?.scroll !== false) {
          requestAnimationFrame(() => {
            document.getElementById("home-tool-workspace")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        }
      } else {
        router.push(target);
      }
    },
    [pathname, router]
  );

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        "pointer-events-none fixed z-[70] flex flex-col items-end gap-2",
        "max-lg:bottom-[calc(4.25rem+max(0.75rem,env(safe-area-inset-bottom,0px)))]",
        "max-lg:right-[max(0.75rem,env(safe-area-inset-right,0px))]",
        "lg:bottom-8 lg:right-10"
      )}
    >
      {open ? (
        <div
          id="floating-concierge-panel"
          role="dialog"
          aria-modal="true"
          aria-label={t("concierge.fabAriaLabel")}
          className={cn(
            "pointer-events-auto absolute bottom-[calc(3.25rem+0.5rem)] right-0 w-[min(92vw,22rem)]",
            "shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          )}
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn(
                interactiveClick,
                "absolute -right-1 -top-1 z-10 inline-flex size-8 items-center justify-center rounded-full",
                "border border-white/[0.14] bg-slate-900/90 text-slate-200 shadow-md backdrop-blur-xl",
                "hover:bg-slate-800 light:border-slate-300 light:bg-white light:text-slate-800"
              )}
              aria-label={t("concierge.close")}
            >
              <X className="size-4" aria-hidden />
            </button>
            <ConciergeChat compact onOpenTool={handleOpenTool} />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          interactiveClick,
          "pointer-events-auto ml-auto flex items-center gap-2 self-end rounded-full border py-2 pl-2 pr-3 shadow-lg backdrop-blur-xl",
          "border-violet-400/40 bg-slate-950/75 text-white",
          "hover:border-violet-400/60 hover:bg-slate-950/90 hover:shadow-[0_8px_28px_rgba(124,58,237,0.35)]",
          "light:border-violet-300/55 light:bg-white/88 light:text-violet-950 light:hover:bg-white",
          open && "ring-2 ring-violet-400/50"
        )}
        aria-expanded={open}
        aria-controls="floating-concierge-panel"
        aria-label={t("concierge.fabAriaLabel")}
        title={t("concierge.fabHint")}
      >
        <span
          className={cn(
            "relative flex size-10 shrink-0 items-center justify-center rounded-full",
            "bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white",
            "light:from-indigo-600 light:via-violet-600 light:to-fuchsia-600"
          )}
          aria-hidden
        >
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/40 opacity-75" />
          <MessageCircle className="relative size-5" strokeWidth={2} />
        </span>
        <span className="max-w-[9.5rem] text-left text-xs font-semibold leading-tight sm:max-w-[11rem] sm:text-[13px]">
          {t("concierge.fabHint")}
        </span>
      </button>
    </div>,
    document.body
  );
}
