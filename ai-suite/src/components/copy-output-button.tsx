"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/i18n-provider";

const COPY_RESET_MS = 2000;

export function useCopyFeedback(onCopied?: () => void) {
  const { t } = useI18n();
  const [isCopied, setIsCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copyText = React.useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(t("ui.copySuccessToast"));
        onCopied?.();
        setIsCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setIsCopied(false);
          timeoutRef.current = null;
        }, COPY_RESET_MS);
      } catch {
        toast.error(t("ui.copyFailed"));
      }
    },
    [t, onCopied]
  );

  return { isCopied, copyText };
}

type CopyOutputButtonProps = {
  text: string;
  className?: string;
  onCopied?: () => void;
};

/**
 * Floating copy control for AI result blocks (e.g. /success): absolute top-right, Copy ↔ Check feedback.
 */
export function CopyOutputButton({ text, className, onCopied }: CopyOutputButtonProps) {
  const { t } = useI18n();
  const { isCopied, copyText } = useCopyFeedback(onCopied);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => void copyText(text)}
      className={cn(
        "absolute right-3 top-3 z-10 size-9 shrink-0 rounded-lg border-white/15 bg-background/90 shadow-sm backdrop-blur-md",
        "transition-colors transition-transform duration-150",
        "hover:bg-slate-200 dark:hover:bg-slate-800",
        "active:scale-95",
        className
      )}
      aria-label={isCopied ? t("ui.copied") : t("success.copy")}
    >
      {isCopied ? (
        <Check className="size-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.25} aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
    </Button>
  );
}
