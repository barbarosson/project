"use client";

import * as React from "react";
import { toast } from "sonner";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type BillingToggle = "monthly" | "yearly";

type PricingModalContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const PricingModalContext = React.createContext<PricingModalContextValue | null>(null);

export function usePricingModal(): PricingModalContextValue {
  const ctx = React.useContext(PricingModalContext);
  if (!ctx) {
    return { open: () => {}, close: () => {}, isOpen: false };
  }
  return ctx;
}

const LS_TRIAL_KEY = "isendai_ls_subscription_trial_used";

function monthlyThenLabel(plan: "basic" | "pro" | "ultra", interval: BillingToggle): string {
  const base = plan === "basic" ? 7.99 : plan === "pro" ? 9.99 : 19.99;
  if (interval === "monthly") return `Then $${base.toFixed(2)}/mo. Cancel anytime.`;
  const perMo = base * 0.8;
  return `Then ~$${perMo.toFixed(2)}/mo equivalent (20% off yearly). Cancel anytime.`;
}

async function startCheckout(
  plan: "basic" | "pro" | "ultra",
  interval: BillingToggle,
  toolId: string
) {
  try {
    if (typeof window !== "undefined" && window.localStorage.getItem(LS_TRIAL_KEY) === "1") {
      toast.message("You’ve already started a subscription trial from this browser.");
    }
  } catch {
    // ignore
  }

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      pack: "subscription",
      plan,
      billing_interval: interval,
      tool_id: toolId,
    }),
  });
  const raw = await res.text();
  let json: { checkout_url?: string; error?: string; code?: string } | null = null;
  try {
    json = JSON.parse(raw) as { checkout_url?: string; error?: string; code?: string };
  } catch {
    json = null;
  }

  if (!res.ok || !json?.checkout_url) {
    toast.error(json?.error ?? "Could not start checkout.");
    return;
  }

  try {
    window.localStorage.setItem(LS_TRIAL_KEY, "1");
  } catch {
    // ignore
  }

  window.location.href = json.checkout_url;
}

async function startOneTime(toolId: string) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pack: "one_time_trial", tool_id: toolId }),
  });
  const raw = await res.text();
  let json: { checkout_url?: string; error?: string } | null = null;
  try {
    json = JSON.parse(raw) as { checkout_url?: string; error?: string };
  } catch {
    json = null;
  }
  if (!res.ok || !json?.checkout_url) {
    toast.error(json?.error ?? "Could not start checkout.");
    return;
  }
  window.location.href = json.checkout_url;
}

function PlanCard({
  title,
  credits,
  highlight,
  plan,
  interval,
  toolId,
}: {
  title: string;
  credits: number;
  highlight?: boolean;
  plan: "basic" | "pro" | "ultra";
  interval: BillingToggle;
  toolId: string;
}) {
  const [busy, setBusy] = React.useState(false);

  const body = (
    <>
      <InnerPlan title={title} credits={credits} badge={plan === "pro" ? "🔥 Most Popular" : undefined} />
      <Button
        className={cn(
          "mt-4 w-full font-semibold",
          highlight
            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
            : "border border-white/15 bg-white/[0.08] text-slate-100 hover:bg-white/[0.12]"
        )}
        disabled={busy}
        variant={highlight ? "default" : "outline"}
        onClick={() => {
          setBusy(true);
          void startCheckout(plan, interval, toolId).finally(() => setBusy(false));
        }}
      >
        Start 7-Day Free Trial
      </Button>
      <p className="mt-2 text-center text-xs text-slate-400">{monthlyThenLabel(plan, interval)}</p>
    </>
  );

  if (highlight) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-violet-500/35 via-fuchsia-500/25 to-indigo-500/35 p-[1px] shadow-xl">
        <div className="flex flex-col rounded-2xl bg-[#0b0b10]/95 p-5 backdrop-blur-xl">{body}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.12] bg-white/[0.06] p-5 shadow-xl backdrop-blur-xl">
      {body}
    </div>
  );
}

function InnerPlan({
  title,
  credits,
  badge,
}: {
  title: string;
  credits: number;
  badge?: string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {badge ? (
          <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-slate-300">{credits.toLocaleString()} credits / month after trial billing</p>
    </>
  );
}

export function PricingModalShell({
  open,
  onClose,
  toolId,
}: {
  open: boolean;
  onClose: () => void;
  toolId: string;
}) {
  const [interval, setInterval] = React.useState<BillingToggle>("monthly");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-[101] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.14]",
          "bg-gradient-to-br from-white/[0.12] via-white/[0.06] to-transparent shadow-2xl backdrop-blur-2xl"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-6 py-5">
          <div>
            <h2 id="pricing-title" className="text-xl font-semibold tracking-tight text-white">
              Upgrade your credits
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              7-day free trial on subscriptions — then your plan renews. Credits reset each billing cycle.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="mx-auto mb-8 flex max-w-md justify-center rounded-full border border-white/[0.12] bg-black/30 p-1">
            <button
              type="button"
              className={cn(
                "flex-1 rounded-full px-4 py-2 text-sm font-medium transition",
                interval === "monthly" ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-slate-200"
              )}
              onClick={() => setInterval("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 rounded-full px-4 py-2 text-sm font-medium transition",
                interval === "yearly" ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-slate-200"
              )}
              onClick={() => setInterval("yearly")}
            >
              Yearly <span className="text-emerald-400/90">(-20%)</span>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <PlanCard title="Basic" credits={500} plan="basic" interval={interval} toolId={toolId} />
            <PlanCard
              title="Pro"
              credits={1000}
              highlight
              plan="pro"
              interval={interval}
              toolId={toolId}
            />
            <PlanCard title="Ultra" credits={5000} plan="ultra" interval={interval} toolId={toolId} />
          </div>

          <div className="mt-8 flex justify-center border-t border-white/[0.06] pt-6">
            <Button
              variant="ghost"
              className="text-sm text-slate-500 hover:bg-white/[0.06] hover:text-slate-300"
              onClick={() => void startOneTime(toolId)}
            >
              $1.49 One-time Trial (25 credits)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function openPricingModal(toolId?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("isendai:open-pricing", { detail: { toolId: toolId ?? "corporate-whisperer" } })
  );
}

export function PricingModalProvider({
  children,
  defaultToolId = "corporate-whisperer",
}: {
  children: React.ReactNode;
  defaultToolId?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [toolId, setToolId] = React.useState(defaultToolId);

  const value = React.useMemo(
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      isOpen,
    }),
    [isOpen]
  );

  React.useEffect(() => {
    function onEv(e: Event) {
      const d = (e as CustomEvent<{ toolId?: string }>).detail;
      if (typeof d?.toolId === "string" && d.toolId.length > 0) {
        setToolId(d.toolId);
      }
      setIsOpen(true);
    }
    window.addEventListener("isendai:open-pricing", onEv);
    return () => window.removeEventListener("isendai:open-pricing", onEv);
  }, []);

  return (
    <PricingModalContext.Provider value={value}>
      {children}
      <PricingModalShell open={isOpen} onClose={() => setIsOpen(false)} toolId={toolId} />
    </PricingModalContext.Provider>
  );
}
