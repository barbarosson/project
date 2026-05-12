"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type Wallet = {
  credits: number;
  trial_days_left: number | null;
  subscription_status: string | null;
};

export function CreditsNav({ className }: { className?: string }) {
  const [data, setData] = React.useState<Wallet | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    function load() {
      void fetch("/api/me/wallet", { cache: "no-store" })
        .then((r) => r.json() as Promise<Wallet>)
        .then((j) => {
          if (!cancelled) setData(j);
        })
        .catch(() => {
          if (!cancelled) setData(null);
        });
    }
    load();
    const id = window.setInterval(load, 60_000);
    function onFocus() {
      load();
    }
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const credits = data?.credits ?? null;
  const trial =
    typeof data?.trial_days_left === "number" &&
    data.subscription_status === "trialing" &&
    data.trial_days_left >= 0
      ? data.trial_days_left
      : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-200 sm:text-sm",
        className
      )}
    >
      <span
        className="inline-flex items-center gap-1 rounded-lg border border-amber-400/25 bg-amber-500/10 px-2 py-1 text-amber-100 backdrop-blur-xl sm:px-3"
        title="Credits balance"
      >
        <span aria-hidden>🪙</span>
        <span>{credits === null ? "…" : credits}</span>
        <span className="hidden text-slate-400 sm:inline">Credits</span>
      </span>
      {trial !== null ? (
        <span className="rounded-lg border border-violet-400/25 bg-violet-500/10 px-2 py-1 text-violet-100 backdrop-blur-xl sm:px-3">
          Trial: {trial} day{trial === 1 ? "" : "s"} left
        </span>
      ) : null}
    </div>
  );
}
