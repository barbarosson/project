"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { IsendaiLogo } from "@/components/isendai-logo";

export function RouteTransition() {
  const pathname = usePathname();

  return (
    <div
      aria-hidden
      key={pathname}
      className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-background/40 backdrop-blur-sm route-transition-overlay"
    >
      <div className="route-transition-card route-transition-card-anim">
        <IsendaiLogo withWordmark className="justify-center" />
      </div>
    </div>
  );
}

