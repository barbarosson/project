"use client";

import Link from "next/link";

import { isStagingDeploy } from "@/lib/deploy-env";
import { useI18n } from "@/i18n/i18n-provider";

const PRODUCTION_ORIGIN =
  process.env.NEXT_PUBLIC_PRODUCTION_SITE_URL?.trim().replace(/\/+$/, "") ||
  "https://isendai.com";

export function DeployEnvBanner() {
  const { t } = useI18n();

  if (!isStagingDeploy()) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[100] border-b border-amber-400/40 bg-amber-950/95 px-3 py-2 text-center text-xs font-medium text-amber-50 shadow-md backdrop-blur-sm sm:text-sm"
    >
      <span>{t("deploy.stagingBanner")}</span>{" "}
      <Link
        href={PRODUCTION_ORIGIN}
        className="underline underline-offset-2 hover:text-white"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("deploy.stagingOpenProduction")}
      </Link>
    </div>
  );
}
