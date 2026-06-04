"use client";

import { cn } from "@/lib/utils";

const SHEET_URL = "/images/comic-people-silhouettes.png";

/** Vertical gap between dialogue scenes — sparse rhythm along the page. */
const SCENE_GAP_PX = 680;
const SCENE_HEIGHT_PX = 300;
const SCENE_TOP_OFFSET_PX = 100;

type GutterSide = "left" | "right";

/** Zoomed crop: only ~2 figures visible, grounded at bottom. */
const DIALOGUE_CROP = {
  size: "240% auto",
  anchors: ["28% 88%", "52% 88%"] as const,
} as const;

function sceneCount(contentHeight: number): number {
  if (contentHeight <= 0) return 3;
  const usable = contentHeight - SCENE_TOP_OFFSET_PX;
  return Math.max(3, Math.ceil(usable / SCENE_GAP_PX) + 1);
}

function DialogueScene({
  side,
  index,
  topPx,
}: {
  side: GutterSide;
  index: number;
  topPx: number;
}) {
  const isLeft = side === "left";
  const cropPos = DIALOGUE_CROP.anchors[index % DIALOGUE_CROP.anchors.length];

  return (
    <div
      className={cn(
        "absolute inset-x-[4%] flex items-end justify-center",
        isLeft ? "origin-bottom" : "origin-bottom"
      )}
      style={{
        top: topPx,
        height: SCENE_HEIGHT_PX,
      }}
    >
      <div
        className={cn(
          "comic-silhouette-sheet h-full w-full max-w-[11rem] bg-no-repeat sm:max-w-[12.5rem]",
          !isLeft && "-scale-x-100"
        )}
        style={{
          backgroundImage: `url(${SHEET_URL})`,
          backgroundSize: DIALOGUE_CROP.size,
          backgroundPosition: `${cropPos}`,
        }}
        aria-hidden
      />
    </div>
  );
}

export function ComicGutterSilhouettes({
  side,
  contentHeight,
}: {
  side: GutterSide;
  contentHeight: number;
}) {
  const isLeft = side === "left";
  const count = sceneCount(contentHeight);
  const minH =
    contentHeight > 0
      ? contentHeight
      : SCENE_GAP_PX * count + SCENE_TOP_OFFSET_PX;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0",
        isLeft
          ? "[mask-image:linear-gradient(to_right,black_0%,black_55%,transparent_95%)]"
          : "[mask-image:linear-gradient(to_left,black_0%,black_55%,transparent_95%)]"
      )}
      style={{ minHeight: minH }}
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-b from-transparent via-violet-950/[0.03] to-violet-950/15",
          "light:via-slate-200/15 light:to-slate-300/10"
        )}
      />

      {Array.from({ length: count }, (_, i) => (
        <DialogueScene
          key={`${side}-dialogue-${i}`}
          side={side}
          index={i}
          topPx={SCENE_TOP_OFFSET_PX + i * SCENE_GAP_PX}
        />
      ))}
    </div>
  );
}
