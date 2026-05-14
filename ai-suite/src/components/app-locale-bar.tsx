"use client";

import { usePathname } from "next/navigation";

import { SiteLocaleToolbar } from "@/components/site-locale-toolbar";
import { cn } from "@/lib/utils";

/**
 * Global language control rendered once in the root layout so every route
 * (account, auth flows, success, etc.) can switch locale without per-page wiring.
 * Hidden on `/account` — that page renders {@link SiteLocaleToolbar} in the header.
 */
export function AppLocaleBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/account")) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-[calc(100vw-2rem)] justify-end sm:bottom-auto sm:top-4 sm:right-4"
      )}
    >
      <div className="pointer-events-auto rounded-xl border border-white/[0.08] bg-black/45 p-0.5 shadow-lg backdrop-blur-md">
        <SiteLocaleToolbar />
      </div>
    </div>
  );
}
