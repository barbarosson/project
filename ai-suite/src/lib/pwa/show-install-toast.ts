import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";

import type { InstallPlatform } from "@/lib/pwa/install-guide-path";
import { installGuideHref } from "@/lib/pwa/install-guide-path";

type Translate = (key: string) => string;

export function showInstallGuideToast(
  t: Translate,
  router: AppRouterInstance,
  messageKey: string,
  platform?: InstallPlatform
) {
  toast.message(t(messageKey), {
    duration: 10000,
    action: {
      label: t("pwa.toastGuideLink"),
      onClick: () => router.push(installGuideHref(platform)),
    },
  });
}
