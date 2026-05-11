"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n-provider";

export function NotFoundContent() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("notFound.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("notFound.description")}</p>
      <Button asChild variant="outline">
        <Link href="/">
          <ArrowLeft className="size-4" />
          {t("nav.backToHome")}
        </Link>
      </Button>
    </div>
  );
}
