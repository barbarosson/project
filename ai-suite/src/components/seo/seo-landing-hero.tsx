import { Sparkles } from "lucide-react";

import {
  sectionGradientBodySm,
  sectionGradientHeading,
  sectionGradientShell,
} from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

export function SeoLandingHero({
  h1,
  paragraph,
  className,
}: {
  h1: string;
  paragraph: string;
  className?: string;
}) {
  return (
    <section
      className={cn(sectionGradientShell, "mb-8", className)}
      aria-labelledby="seo-landing-heading"
    >
      <div className="pointer-events-none absolute -left-16 top-0 size-48 rounded-full bg-violet-500/20 blur-3xl" aria-hidden />
      <div
        className="pointer-events-none absolute -bottom-12 -right-12 size-40 rounded-full bg-fuchsia-500/15 blur-3xl"
        aria-hidden
      />
      <div className="relative min-w-0">
        <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/35 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-violet-100 sm:text-sm">
          <Sparkles className="size-3.5 shrink-0 text-fuchsia-300 sm:size-4" aria-hidden />
          Free AI draft — pay only when you generate
        </p>
        <h1 id="seo-landing-heading" className={cn("mt-4", sectionGradientHeading)}>
          {h1}
        </h1>
        <p className={cn("mt-4 max-w-3xl", sectionGradientBodySm)}>{paragraph}</p>
      </div>
    </section>
  );
}
