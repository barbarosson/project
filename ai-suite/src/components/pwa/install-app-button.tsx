"use client";

import * as React from "react";
import { Download, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useI18n } from "@/i18n/i18n-provider";
import {
  isAndroidDevice,
  isBeforeInstallPromptEvent,
  isIosDevice,
  isStandaloneDisplayMode,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa/client";
import { showInstallGuideToast } from "@/lib/pwa/show-install-toast";
import { cn } from "@/lib/utils";

type InstallAppButtonProps = {
  /** Compact style for the site header; default is hero-sized. */
  variant?: "header" | "hero";
  className?: string;
};

export function InstallAppButton({ variant = "hero", className }: InstallAppButtonProps) {
  const { t } = useI18n();
  const router = useRouter();
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
      showInstallGuideToast(t, router, "pwa.toastIos", "ios");
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setVisible(false);
        } else if (outcome === "dismissed") {
          showInstallGuideToast(
            t,
            router,
            isAndroidDevice() ? "pwa.toastAndroid" : "pwa.toastDesktop",
            isAndroidDevice() ? "android" : "desktop"
          );
        }
      } catch {
        showInstallGuideToast(
          t,
          router,
          isAndroidDevice() ? "pwa.toastAndroid" : "pwa.toastDesktop",
          isAndroidDevice() ? "android" : "desktop"
        );
      } finally {
        setDeferredPrompt(null);
      }
      return;
    }

    if (isAndroidDevice()) {
      showInstallGuideToast(t, router, "pwa.toastAndroid", "android");
      return;
    }

    showInstallGuideToast(t, router, "pwa.toastDesktop", "desktop");
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
          ? "min-h-9 px-2 py-1.5 text-xs max-sm:gap-0 sm:min-h-10 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
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
      <span className={isHeader ? "hidden xl:inline" : undefined}>
        {isHeader ? t("pwa.installShort") : t("pwa.install")}
      </span>
    </button>
  );
}
