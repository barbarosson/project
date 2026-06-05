"use client";

import { cn } from "@/lib/utils";

const SHEET_URL = "/images/comic-people-silhouettes.png";

type GutterSide = "left" | "right";

export function ComicGutterSilhouettes({ side }: { side: GutterSide }) {
  const isLeft = side === "left";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 isolate z-[1] overflow-hidden",
        isLeft
          ? "[mask-image:linear-gradient(to_right,black_0%,black_78%,transparent_100%)]"
          : "[mask-image:linear-gradient(to_left,black_0%,black_78%,transparent_100%)]"
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0 bg-[hsl(var(--shell-base))]"
        aria-hidden
      />
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-b from-fuchsia-500/[0.07] via-violet-500/[0.1] to-cyan-400/[0.09]",
          "dark:from-fuchsia-400/[0.12] dark:via-violet-400/[0.14] dark:to-cyan-300/[0.11]"
        )}
        aria-hidden
      />
      <div
        className={cn(
          "comic-gutter-silhouette-layer absolute inset-[-10%_-4%] bg-no-repeat",
          !isLeft && "-scale-x-100"
        )}
        style={{
          backgroundImage: `url(${SHEET_URL})`,
          backgroundSize: "185% auto",
          backgroundRepeat: "repeat-y",
          backgroundPosition: isLeft ? "8% 100%" : "92% 100%",
        }}
      />
      <div
        className={cn(
          "comic-gutter-silhouette-layer comic-gutter-silhouette-layer--ghost absolute inset-[-6%_-2%] bg-no-repeat",
          !isLeft && "-scale-x-100"
        )}
        style={{
          backgroundImage: `url(${SHEET_URL})`,
          backgroundSize: "145% auto",
          backgroundRepeat: "repeat-y",
          backgroundPosition: isLeft ? "62% 88%" : "38% 88%",
        }}
      />
      <div
        className={cn(
          "absolute inset-0 hidden",
          "light:block light:opacity-20",
          "bg-gradient-to-b from-[hsl(var(--shell-base))] via-transparent to-[hsl(var(--shell-base))]/80"
        )}
      />
      <div
        className={cn(
          "absolute inset-0 hidden",
          "light:block",
          "bg-gradient-to-b from-transparent via-violet-200/20 to-slate-200/15"
        )}
      />
    </div>
  );
}
