"use client";

import { cn } from "@/lib/utils";

export function GlobalBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("global-bg pointer-events-none fixed inset-0 -z-10", className)}>
      <div className="global-bg-base absolute inset-0" />
      <div className="global-bg-image absolute inset-0" />
      <div className="global-bg-grid absolute inset-0" />
      <div className="global-bg-aurora aurora absolute -inset-[40%] opacity-80" />
      <div className="global-bg-aurora aurora aurora-2 absolute -inset-[50%] opacity-70" />
      <div className="absolute -left-40 -top-40 size-[520px] rounded-full bg-purple-600/20 blur-[120px]" />
      <div className="absolute -bottom-48 -right-48 size-[620px] rounded-full bg-indigo-600/20 blur-[140px]" />
      <div className="global-bg-noise absolute inset-0" />
      <div className="global-bg-vignette absolute inset-0" />
    </div>
  );
}

