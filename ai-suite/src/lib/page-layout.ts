import { cn } from "@/lib/utils";

/** Horizontal padding shared across page shells. */
export const siteGutter = "px-4 sm:px-6 lg:px-8";

/** Prevents flex/grid children from forcing horizontal scroll. */
export const siteMinWidth0 = "min-w-0 max-w-full";

/**
 * Page shell width variants.
 * - auth: login / password — wider on desktop than legacy max-w-md-only
 * - content: account, history, pricing
 * - narrow: success, tool detail, profile
 * - legal: terms, privacy
 */
const pageWidth = {
  auth: "max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
  content: "max-w-4xl lg:max-w-5xl xl:max-w-6xl",
  narrow: "max-w-3xl lg:max-w-4xl",
  legal: "max-w-3xl lg:max-w-4xl",
} as const;

export type PageShellVariant = keyof typeof pageWidth;

export function pageMain(
  variant: PageShellVariant,
  extra?: string
): string {
  return cn(
    "mx-auto w-full",
    siteMinWidth0,
    pageWidth[variant],
    siteGutter,
    "py-10 sm:py-12 md:py-14",
    extra
  );
}

/** Home / marketing header & footer inner width. */
export function siteContainer(extra?: string): string {
  return cn("mx-auto w-full", siteMinWidth0, "max-w-6xl", siteGutter, extra);
}
