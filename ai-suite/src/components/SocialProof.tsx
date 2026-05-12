"use client";

import * as React from "react";
import { toast } from "sonner";

const MESSAGES: readonly string[] = [
  "🔥 A user from London just generated a resignation letter.",
  "✨ Someone in New York just used The Perfect Apology.",
  "🔥 A founder in Austin just polished a cold outreach DM.",
  "✨ A reader from Berlin just fixed an awkward text thread.",
  "🔥 Someone in Toronto just drafted a refund request.",
  "✨ A user from Sydney just generated a professional apology.",
  "🔥 A marketer in Chicago just improved a LinkedIn message.",
  "✨ Someone in Paris just used The Corporate Whisperer.",
  "🔥 A student in Boston just polished an academic email.",
  "✨ A user from Singapore just generated a boundary-setting reply.",
  "🔥 Someone in Dublin just drafted an invoice reminder.",
  "✨ A creator in LA just improved a collaboration pitch.",
  "🔥 A user from Amsterdam just generated a neighbor complaint note.",
  "✨ Someone in Dubai just used The Graceful Quitter.",
  "🔥 A shopper in Seattle just drafted a refund escalation email.",
  "✨ A user from Mumbai just polished a cover letter intro.",
  "🔥 Someone in São Paulo just generated a deadline extension request.",
  "✨ A user from Seoul just improved a sensitive family message.",
  "🔥 A freelancer in Denver just drafted a scope clarification.",
  "✨ Someone in Zurich just used Dating Roast for their bio.",
];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function SocialProof() {
  React.useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    function scheduleNext() {
      const delayMs = randomBetween(20_000, 45_000);
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        const msg = MESSAGES[randomBetween(0, MESSAGES.length - 1)];
        toast(msg, {
          position: "bottom-left",
          duration: 6500,
          className:
            "border border-white/[0.12] bg-[#0c0c0f]/95 text-slate-100 shadow-[0_8px_30px_rgba(139,92,246,0.15)] backdrop-blur-xl",
        });
        scheduleNext();
      }, delayMs);
    }

    scheduleNext();
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
