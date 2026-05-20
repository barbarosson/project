"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n-provider";
import { SitePageChrome, SitePageHeader, SitePageMain } from "@/components/site-page-layout";
import { pageContentSection, pageSubtitle, pageTitle } from "@/lib/premium-ui";
import { trackGaEvent } from "@/lib/analytics/gtag";
import { reportClientError } from "@/lib/observability/report-error";
import { cn } from "@/lib/utils";

type ErrorContentProps = {
  reset?: () => void;
  digest?: string;
};

export function ErrorContent({ reset, digest }: ErrorContentProps) {
  const { t } = useI18n();

  React.useEffect(() => {
    trackGaEvent("exception", {
      description: "segment_error_boundary",
      fatal: false,
      ...(digest ? { error_digest: digest } : {}),
    });
    void reportClientError({
      message: "segment_error_boundary",
      digest,
      scope: "error_boundary",
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
  }, [digest]);
  return (
    <SitePageChrome>
      <SitePageHeader />
      <SitePageMain width="auth">
        <div
          className={cn(
            "mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-4 rounded-2xl px-6 py-14 text-center",
            pageContentSection
          )}
        >
          <h1 className={pageTitle}>{t("errorPage.title")}</h1>
          <p className={pageSubtitle}>{t("errorPage.description")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {reset ? (
              <Button type="button" onClick={() => reset()}>
                <RotateCcw className="size-4" />
                {t("errorPage.retry")}
              </Button>
            ) : null}
            <Button asChild variant={reset ? "outline" : "default"}>
              <Link href="/">
                <ArrowLeft className="size-4" />
                {t("nav.backToHome")}
              </Link>
            </Button>
          </div>
        </div>
      </SitePageMain>
    </SitePageChrome>
  );
}
