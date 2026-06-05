"use client";

import { useMemo, type CSSProperties } from "react";

import { getToolDefinition, type ToolName } from "@/components/ai-suite/tools";
import { useI18n } from "@/i18n/i18n-provider";
import { toolTitle } from "@/i18n/tool-i18n";
import { ComicGutterSilhouettes } from "@/components/comic-gutter-silhouettes";
import {
  COMIC_SIDEBAR_EXAMPLES,
  comicSidebarLine,
} from "@/lib/comic-sidebar-examples";
import { cn } from "@/lib/utils";

type BubbleVariant = "before" | "after";
type TailSide = "left" | "right";

type PlacedBubble = {
  id: string;
  tool: ToolName;
  variant: BubbleVariant;
  tail: TailSide;
  side: "left" | "right";
  topPct: number;
  className?: string;
};

function ComicSpeechBubble({
  variant,
  label,
  tool,
  robotName,
  text,
  tail,
  className,
}: {
  variant: BubbleVariant;
  label: string;
  tool: ToolName;
  robotName: string;
  text: string;
  tail: TailSide;
  className?: string;
}) {
  const isBefore = variant === "before";
  const emoji = getToolDefinition(tool).emoji;

  return (
    <div
      className={cn(
        "comic-bubble relative max-w-[min(100%,18rem)] rounded-2xl border-[2.5px] px-3 py-2.5",
        "font-display text-[11px] leading-snug tracking-tight shadow-[4px_4px_0_rgba(0,0,0,0.45)]",
        isBefore
          ? "border-rose-200/60 bg-rose-950/72 text-rose-50 backdrop-blur-[2px] light:border-rose-400/70 light:bg-rose-50/92 light:text-rose-950 light:shadow-[0_2px_12px_rgba(190,24,93,0.08)]"
          : "border-emerald-200/60 bg-emerald-950/72 text-emerald-50 backdrop-blur-[2px] light:border-emerald-400/70 light:bg-emerald-50/92 light:text-emerald-950 light:shadow-[0_2px_12px_rgba(5,150,105,0.08)]",
        className
      )}
    >
      <span className="mb-1 flex items-start gap-1.5 text-[10px] font-bold leading-tight text-violet-200/95">
        <span aria-hidden className="shrink-0 text-sm leading-none">
          {emoji}
        </span>
        <span className="line-clamp-2 text-pretty">{robotName}</span>
      </span>
      <span
        className={cn(
          "mb-1 block text-[9px] font-black uppercase tracking-[0.2em]",
          isBefore ? "text-rose-300/90" : "text-emerald-300/90"
        )}
      >
        {label}
      </span>
      <p className="text-pretty font-semibold leading-snug">{text}</p>
      <span
        aria-hidden
        className={cn(
          "comic-bubble-tail absolute bottom-[-11px] size-0 border-[11px] border-transparent",
          tail === "left" ? "left-6" : "right-6",
          isBefore ? "border-t-rose-950/55" : "border-t-emerald-950/55"
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute bottom-[-14px] size-0 border-[12px] border-transparent",
          tail === "left" ? "left-[22px]" : "right-[22px]",
          isBefore ? "border-t-rose-200/55" : "border-t-emerald-200/55"
        )}
      />
    </div>
  );
}

function buildPlacedBubbles(): { left: PlacedBubble[]; right: PlacedBubble[] } {
  const left: PlacedBubble[] = [];
  const right: PlacedBubble[] = [];
  const count = COMIC_SIDEBAR_EXAMPLES.length;
  const start = 2;
  const end = 98;
  const step = (end - start) / count;

  COMIC_SIDEBAR_EXAMPLES.forEach((ex, index) => {
    const topPct = start + index * step;
    const onLeft = index % 2 === 0;
    const side = onLeft ? "left" : "right";
    const bucket = onLeft ? left : right;

    bucket.push({
      id: `${ex.tool}-before`,
      tool: ex.tool,
      variant: "before",
      side,
      tail: onLeft ? "right" : "left",
      topPct,
      className: cn(onLeft ? "-rotate-2" : "rotate-2 ml-auto", index % 3 === 1 && "rotate-1"),
    });
    bucket.push({
      id: `${ex.tool}-after`,
      tool: ex.tool,
      variant: "after",
      side,
      tail: onLeft ? "left" : "right",
      topPct: Math.min(topPct + step * 0.42, end - 1),
      className: cn(onLeft ? "rotate-1 ml-auto" : "-rotate-1 mr-1"),
    });
  });

  return { left, right };
}

const { left: LEFT_PLACED, right: RIGHT_PLACED } = buildPlacedBubbles();

function ComicGutterColumn({
  side,
  bubbles,
  beforeLabel,
  afterLabel,
  robotTitle,
  lineFor,
}: {
  side: "left" | "right";
  bubbles: PlacedBubble[];
  beforeLabel: string;
  afterLabel: string;
  robotTitle: (tool: ToolName) => string;
  lineFor: (tool: ToolName, variant: BubbleVariant) => string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-y-0 hidden w-[max(0px,calc((100vw-72rem)/2))] xl:block",
        side === "left" ? "left-0" : "right-0"
      )}
    >
      <div
        className={cn(
          "relative h-full w-full px-3 py-8",
          side === "left"
            ? "[mask-image:linear-gradient(to_right,black_0%,black_50%,transparent_100%)]"
            : "[mask-image:linear-gradient(to_left,black_0%,black_50%,transparent_100%)]"
        )}
      >
        <ComicGutterSilhouettes side={side} />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-[2]",
            side === "left"
              ? "[mask-image:linear-gradient(to_right,black_0%,black_50%,transparent_100%)]"
              : "[mask-image:linear-gradient(to_left,black_0%,black_50%,transparent_100%)]"
          )}
        >
          <div className="comic-halftone absolute inset-0 opacity-[0.22]" aria-hidden />
          {bubbles.map((bubble) => (
            <div
              key={`${side}-${bubble.id}`}
              className="absolute z-[1] w-full max-w-full px-1"
              style={{ top: `${bubble.topPct}%`, transform: "translateY(-50%)" } as CSSProperties}
            >
              <ComicSpeechBubble
                variant={bubble.variant}
                tail={bubble.tail}
                tool={bubble.tool}
                label={bubble.variant === "before" ? beforeLabel : afterLabel}
                robotName={robotTitle(bubble.tool)}
                text={lineFor(bubble.tool, bubble.variant)}
                className={bubble.className}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Comic speech bubbles in side gutters (wide screens). Height follows page content via CSS only. */
export function ComicSidebarBackground() {
  const { t, locale } = useI18n();

  const exampleByTool = useMemo(
    () => new Map(COMIC_SIDEBAR_EXAMPLES.map((ex) => [ex.tool, ex])),
    []
  );

  const beforeLabel = t("home.demo.before.label");
  const afterLabel = t("home.demo.after.label");

  const robotTitle = (tool: ToolName) =>
    toolTitle(t, tool, getToolDefinition(tool).title);

  const lineFor = (tool: ToolName, variant: BubbleVariant) => {
    const ex = exampleByTool.get(tool);
    if (!ex) return "";
    const line = variant === "before" ? ex.before : ex.after;
    return comicSidebarLine(line, locale);
  };

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[15] hidden overflow-hidden xl:block"
    >
      <ComicGutterColumn
        side="left"
        bubbles={LEFT_PLACED}
        beforeLabel={beforeLabel}
        afterLabel={afterLabel}
        robotTitle={robotTitle}
        lineFor={lineFor}
      />
      <ComicGutterColumn
        side="right"
        bubbles={RIGHT_PLACED}
        beforeLabel={beforeLabel}
        afterLabel={afterLabel}
        robotTitle={robotTitle}
        lineFor={lineFor}
      />
    </div>
  );
}
