"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n-provider";

export function CopyVersionButton({ text }: { text: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = React.useState(false);

  async function copy() {
    setBusy(true);
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("ui.copied"));
    } catch {
      toast.error(t("ui.copyFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={copy} disabled={busy} className="h-8 px-3 text-xs">
      {busy ? t("ui.copying") : t("ui.copy")}
    </Button>
  );
}

