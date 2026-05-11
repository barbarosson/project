"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyVersionButton({ text }: { text: string }) {
  const [busy, setBusy] = React.useState(false);

  async function copy() {
    setBusy(true);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied.");
    } catch {
      toast.error("Copy failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={copy} disabled={busy} className="h-8 px-3 text-xs">
      {busy ? "Copying…" : "Copy"}
    </Button>
  );
}

