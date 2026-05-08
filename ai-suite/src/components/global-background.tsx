"use client";

import { cn } from "@/lib/utils";

export function GlobalBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("global-bg pointer-events-none fixed inset-0 -z-10", className)}>
      <div className="global-bg-base absolute inset-0" />
      <div className="global-bg-grid absolute inset-0" />
      <div className="global-bg-aurora aurora absolute -inset-[40%] opacity-80" />
      <div className="global-bg-aurora aurora aurora-2 absolute -inset-[50%] opacity-70" />
      <div className="global-bg-noise absolute inset-0" />
      <div className="global-bg-vignette absolute inset-0" />
    </div>
  );
}

