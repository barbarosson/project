"use client";

import * as React from "react";

/** Escape to close + focus panel when a modal opens. */
export function useDialogA11y(
  open: boolean,
  onClose: () => void,
  panelRef: React.RefObject<HTMLElement | null>
) {
  React.useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => panelRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, panelRef]);
}
