"use client";

import * as React from "react";
import { CheckCircle2, Lightbulb, Monitor, Smartphone, TabletSmartphone } from "lucide-react";

import { InstallAppButton } from "@/components/pwa/install-app-button";
import type { InstallGuideContent } from "@/i18n/install-guide-content";
import {
  isAndroidDevice,
  isIosDevice,
  isStandaloneDisplayMode,
} from "@/lib/pwa/client";
import type { InstallPlatform } from "@/lib/pwa/install-guide-path";
import { glassInteractive, glassSurface, pageContentSection } from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

const PLATFORMS: InstallPlatform[] = ["ios", "android", "desktop"];

const platformIcons: Record<InstallPlatform, React.ReactNode> = {
  ios: <TabletSmartphone className="size-4 shrink-0" aria-hidden />,
  android: <Smartphone className="size-4 shrink-0" aria-hidden />,
  desktop: <Monitor className="size-4 shrink-0" aria-hidden />,
};

function detectPlatform(): InstallPlatform {
  if (typeof window === "undefined") return "ios";
  if (isIosDevice()) return "ios";
  if (isAndroidDevice()) return "android";
  return "desktop";
}

function platformFromHash(): InstallPlatform | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace("#", "");
  if (hash === "ios" || hash === "android" || hash === "desktop") return hash;
  return null;
}

type InstallGuideProps = {
  content: InstallGuideContent;
};

export function InstallGuide({ content }: InstallGuideProps) {
  const [platform, setPlatform] = React.useState<InstallPlatform>("ios");
  const [standalone, setStandalone] = React.useState(false);

  React.useEffect(() => {
    setStandalone(isStandaloneDisplayMode());
    setPlatform(platformFromHash() ?? detectPlatform());

    const onHashChange = () => {
      const fromHash = platformFromHash();
      if (fromHash) setPlatform(fromHash);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function selectPlatform(next: InstallPlatform) {
    setPlatform(next);
    window.history.replaceState(null, "", `#${next}`);
  }

  const guide = content.platforms[platform];

  return (
    <div className="space-y-6">
      {!standalone ? (
        <section className={cn(glassSurface, pageContentSection, "p-5 sm:p-6")}>
          <p className="text-sm text-slate-200 sm:text-base">{content.tryInstallCta}</p>
          <div className="mt-4">
            <InstallAppButton />
          </div>
        </section>
      ) : (
        <section
          className={cn(
            glassSurface,
            pageContentSection,
            "flex items-start gap-3 border-emerald-500/30 p-5 sm:p-6"
          )}
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" aria-hidden />
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg">
              {content.alreadyInstalledTitle}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-200 sm:text-base">
              {content.alreadyInstalledBody}
            </p>
          </div>
        </section>
      )}

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-violet-200/90 sm:text-sm">
          {content.selectPlatform}
        </p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => selectPlatform(key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all sm:text-sm",
                platform === key
                  ? "border-violet-400/55 bg-violet-500/20 text-violet-100"
                  : "border-white/[0.1] bg-white/[0.03] text-slate-300 hover:border-violet-400/35 hover:text-white"
              )}
              aria-pressed={platform === key}
            >
              {platformIcons[key]}
              {content.platforms[key].label}
            </button>
          ))}
        </div>
      </div>

      <section className={cn(glassInteractive, pageContentSection, "p-5 sm:p-8")}>
        <h2 className="text-lg font-semibold text-white sm:text-xl">{guide.label}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-200 sm:text-base">{guide.intro}</p>

        <ol className="mt-6 space-y-4">
          {guide.steps.map((step, index) => (
            <li
              key={index}
              className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5"
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-200"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white sm:text-base">
                  <span className="sr-only">
                    {content.stepLabel} {index + 1}:{" "}
                  </span>
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-200 sm:text-base">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div
          className={cn(
            "mt-6 flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 sm:p-5",
            "light:border-amber-500/40 light:bg-amber-50/90"
          )}
        >
          <Lightbulb
            className="mt-0.5 size-5 shrink-0 text-amber-300 light:text-amber-700"
            aria-hidden
          />
          <p
            className={cn(
              "text-sm leading-relaxed text-amber-100/95 sm:text-base",
              "light:text-amber-950"
            )}
          >
            {guide.tip}
          </p>
        </div>
      </section>
    </div>
  );
}
