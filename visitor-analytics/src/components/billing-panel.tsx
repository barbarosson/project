"use client";

import { useState } from "react";

type Plan = {
  id: string;
  label: string;
  pageviews: number;
  priceUsd: number | null;
};

type Quota = {
  plan: string;
  planLabel: string;
  pageviewsUsed: number;
  pageviewLimit: number;
  usagePct: number;
  softWarning: boolean;
  hardExceeded: boolean;
  billingStatus: string;
  quotaMonth: string;
};

export function BillingPanel({
  billingConfigured,
  canManage,
  quota,
  plans,
}: {
  billingConfigured: boolean;
  canManage: boolean;
  quota: Quota;
  plans: Plan[];
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function checkout(plan: string) {
    setLoading(plan);
    setMsg(null);
    const res = await fetch("/api/org/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(null);
    if (!res.ok) {
      setMsg(data.error || "Checkout failed");
      return;
    }
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setMsg(
      data.message ||
        data.reason ||
        "Checkout stubbed — configure Lemon Squeezy env vars (see README)."
    );
  }

  return (
    <div className="space-y-6">
      <section className="sp-card p-5">
        <h2 className="text-lg font-semibold">Usage this month</h2>
        <p className="text-sm text-[var(--muted)]">
          Plan: {quota.planLabel} · Window {quota.quotaMonth} · Status{" "}
          {quota.billingStatus}
        </p>
        <p
          className="mt-3 text-3xl font-semibold"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          {quota.pageviewsUsed.toLocaleString()}{" "}
          <span className="text-lg font-normal text-[var(--muted)]">
            / {quota.pageviewLimit.toLocaleString()} PV
          </span>
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded bg-[var(--bg)]">
          <div
            className="h-full rounded"
            style={{
              width: `${Math.min(100, quota.usagePct)}%`,
              background: quota.hardExceeded
                ? "var(--danger)"
                : quota.softWarning
                  ? "var(--accent)"
                  : "var(--brand)",
            }}
          />
        </div>
        {quota.softWarning && !quota.hardExceeded && (
          <p className="mt-2 text-sm text-[var(--accent)]">
            Soft warning: you have used {quota.usagePct}% of this month&apos;s
            pageview quota.
          </p>
        )}
        {quota.hardExceeded && (
          <p className="mt-2 text-sm text-[var(--danger)]">
            Hard limit reached — new pageviews are rejected at ingest (HTTP 429)
            until next month or a plan upgrade.
          </p>
        )}
      </section>

      <section className="sp-card p-5">
        <h2 className="text-lg font-semibold">Plans (Lemon Squeezy MoR)</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          {billingConfigured
            ? "Checkout is connected to Lemon Squeezy."
            : "Billing is stubbed (no API keys). Build/pass without live MoR — set env vars when ready."}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans
            .filter((p) => p.id !== "dev")
            .map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-[var(--line)] p-4"
              >
                <p
                  className="text-xl font-semibold"
                  style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                >
                  {p.label}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {p.pageviews.toLocaleString()} PV/mo
                </p>
                <p className="mt-2 font-semibold">
                  {p.priceUsd != null ? `$${p.priceUsd}/mo` : "—"}
                </p>
                {canManage && (
                  <button
                    type="button"
                    className="sp-btn sp-btn-primary mt-3 w-full !text-sm"
                    disabled={loading === p.id}
                    onClick={() => checkout(p.id)}
                  >
                    {loading === p.id
                      ? "…"
                      : billingConfigured
                        ? "Checkout"
                        : "Stub checkout"}
                  </button>
                )}
              </div>
            ))}
        </div>
        {msg && (
          <p className="mt-4 rounded-lg bg-[var(--bg)] p-3 text-sm">{msg}</p>
        )}
      </section>
    </div>
  );
}
