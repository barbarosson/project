"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n-provider";
import { SitePageChrome, SitePageHeader, SitePageMain } from "@/components/site-page-layout";
import { pageContentSection, pageSubtitle, pageTitle } from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

export function NotFoundContent() {
  const { t } = useI18n();
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
          <h1 className={pageTitle}>{t("notFound.title")}</h1>
          <p className={pageSubtitle}>{t("notFound.description")}</p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="size-4" />
              {t("nav.backToHome")}
            </Link>
          </Button>
        </div>
      </SitePageMain>
    </SitePageChrome>
  );
}
