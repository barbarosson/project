"use client";

import { cn } from "@/lib/utils";

const SHEET_URL = "/images/comic-people-silhouettes.png";

type GutterSide = "left" | "right";

/** Sparse dialogue scenes as % of column height — no pixel loop tied to scrollHeight. */
const DIALOGUE_SCENES: { top: string; anchor: string }[] = [
  { top: "10%", anchor: "28% 88%" },
  { top: "42%", anchor: "52% 88%" },
  { top: "74%", anchor: "35% 88%" },
];

const DIALOGUE_CROP_SIZE = "240% auto";

function DialogueScene({
  side,
  index,
  top,
  anchor,
}: {
  side: GutterSide;
  index: number;
  top: string;
  anchor: string;
}) {
  const isLeft = side === "left";

  return (
    <div
      className="absolute inset-x-[4%] flex h-[26%] max-h-[260px] min-h-[180px] items-end justify-center"
      style={{ top }}
    >
      <div
        className={cn(
          "comic-silhouette-sheet h-full w-full max-w-[11rem] bg-no-repeat sm:max-w-[12.5rem]",
          !isLeft && "-scale-x-100",
          index % 2 === 1 && "opacity-90"
        )}
        style={{
          backgroundImage: `url(${SHEET_URL})`,
          backgroundSize: DIALOGUE_CROP_SIZE,
          backgroundPosition: anchor,
        }}
        aria-hidden
      />
    </div>
  );
}

export function ComicGutterSilhouettes({ side }: { side: GutterSide }) {
  const isLeft = side === "left";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0",
        isLeft
          ? "[mask-image:linear-gradient(to_right,black_0%,black_55%,transparent_95%)]"
          : "[mask-image:linear-gradient(to_left,black_0%,black_55%,transparent_95%)]"
      )}
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-b from-transparent via-violet-950/[0.03] to-violet-950/15",
          "light:via-slate-200/15 light:to-slate-300/10"
        )}
      />

      {DIALOGUE_SCENES.map((scene, i) => (
        <DialogueScene
          key={`${side}-dialogue-${i}`}
          side={side}
          index={i}
          top={scene.top}
          anchor={scene.anchor}
        />
      ))}
    </div>
  );
}
