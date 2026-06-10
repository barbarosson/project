"use client";

import { Check, Copy } from "lucide-react";

import { useCopyFeedback } from "@/components/copy-output-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/i18n-provider";

export function CopyVersionButton({ text }: { text: string }) {
  const { t } = useI18n();
  const { isCopied, copyText } = useCopyFeedback();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void copyText(text)}
      className={cn(
        "h-8 gap-1.5 px-3 text-xs",
        "transition-colors transition-transform duration-150",
        "hover:bg-slate-200 light:hover:bg-slate-100",
        "active:scale-95"
      )}
      aria-label={isCopied ? t("ui.copied") : t("ui.copy")}
    >
      {isCopied ? (
        <Check className="size-3.5 text-emerald-600 light:text-emerald-700" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {isCopied ? t("ui.copied") : t("ui.copy")}
    </Button>
  );
}
