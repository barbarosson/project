"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import { glassSurface, textGradientHero } from "@/lib/premium-ui";

export function NotFoundContent() {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 rounded-2xl px-6 py-14 text-center",
        glassSurface
      )}
    >
      <h1 className={cn("text-2xl font-semibold tracking-tight", textGradientHero)}>{t("notFound.title")}</h1>
      <p className="text-sm text-slate-400">{t("notFound.description")}</p>
      <Button asChild>
        <Link href="/">
          <ArrowLeft className="size-4" />
          {t("nav.backToHome")}
        </Link>
      </Button>
    </div>
  );
}
