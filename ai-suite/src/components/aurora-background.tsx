"use client";

import { cn } from "@/lib/utils";

export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
      <div className="aurora absolute -inset-[40%] opacity-80" />
      <div className="aurora aurora-2 absolute -inset-[50%] opacity-70" />
    </div>
  );
}

