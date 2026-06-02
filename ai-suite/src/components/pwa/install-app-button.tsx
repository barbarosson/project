"use client";

import * as React from "react";
import { Download, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/i18n/i18n-provider";
import {
  isAndroidDevice,
  isBeforeInstallPromptEvent,
  isIosDevice,
  isStandaloneDisplayMode,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa/client";
import { cn } from "@/lib/utils";

type InstallAppButtonProps = {
  /** Compact style for the site header; default is hero-sized. */
  variant?: "header" | "hero";
  className?: string;
};

export function InstallAppButton({ variant = "hero", className }: InstallAppButtonProps) {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (isStandaloneDisplayMode()) {
      setVisible(false);
      return;
    }

    setVisible(true);

    const onBeforeInstall = (e: Event) => {
      if (!isBeforeInstallPromptEvent(e)) return;
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  async function handleClick() {
    if (isStandaloneDisplayMode()) {
      toast.message(t("pwa.toastInstalled"));
      return;
    }

    if (isIosDevice()) {
      toast.message(t("pwa.toastIos"), { duration: 10000 });
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setVisible(false);
        }
      } catch {
        toast.message(
          isAndroidDevice() ? t("pwa.toastAndroid") : t("pwa.toastDesktop"),
          { duration: 10000 }
        );
      } finally {
        setDeferredPrompt(null);
      }
      return;
    }

    if (isAndroidDevice()) {
      toast.message(t("pwa.toastAndroid"), { duration: 10000 });
      return;
    }

    toast.message(t("pwa.toastDesktop"), { duration: 9000 });
  }

  const isHeader = variant === "header";

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border font-semibold transition-all duration-200",
        "border-violet-400/35 bg-violet-500/10 text-violet-100 backdrop-blur-xl",
        "hover:border-violet-400/55 hover:bg-violet-500/20 active:scale-[0.98]",
        isHeader
          ? "min-h-10 px-3 py-2 text-xs sm:text-sm"
          : "min-h-12 w-full px-5 py-3 text-sm sm:w-auto sm:min-w-[min(100%,12rem)]",
        className
      )}
      aria-label={t("pwa.install")}
    >
      {isHeader ? (
        <Smartphone className="size-4 shrink-0" aria-hidden />
      ) : (
        <Download className="size-4 shrink-0" aria-hidden />
      )}
      <span>{isHeader ? t("pwa.installShort") : t("pwa.install")}</span>
    </button>
  );
}
