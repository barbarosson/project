"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing-chrome";
import { PLAN_LIMITS } from "@/lib/plans";

const PLANS = (
  ["starter", "agency", "scale"] as const
).map((id) => ({
  id,
  ...PLAN_LIMITS[id],
  highlight: id === "agency",
  blurb:
    id === "starter"
      ? "Solo marketers and small portfolios."
      : id === "agency"
        ? "Primary plan for agencies — multi-site + clients."
        : "Growing agencies with high traffic.",
}));

export default function PricingPage() {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function checkout(plan: string) {
    setLoading(plan);
    setMsg(null);
    // Prefer logged-in checkout; otherwise send to register
    const billing = await fetch("/api/org/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (billing.status === 401) {
      setLoading(null);
      window.location.href = `/register?plan=${plan}`;
      return;
    }
    const data = await billing.json().catch(() => ({}));
    setLoading(null);
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    if (data.stub) {
      setMsg(
        data.message ||
          "Checkout is stubbed until Lemon Squeezy keys are configured. Create an account and use Billing."
      );
      return;
    }
    setMsg(data.error || "Checkout unavailable — try logging in first.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <MarketingHeader />
      <section className="mt-14">
        <h1
          className="text-4xl font-semibold tracking-tight text-[var(--brand-ink)]"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Pricing
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          USD subscription via Lemon Squeezy (Merchant of Record). No lifetime
          deals / AppSumo in year one. Prices are list — MoR fees reduce net.
        </p>
      </section>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className="sp-card flex flex-col p-6"
            style={
              p.highlight
                ? { borderColor: "var(--brand)", boxShadow: "0 0 0 1px var(--brand)" }
                : undefined
            }
          >
            {p.highlight && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--brand)]">
                Most popular
              </p>
            )}
            <h2
              className="text-2xl font-semibold"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              {p.label}
            </h2>
            <p className="mt-1 text-3xl font-semibold">
              ${p.priceUsd}
              <span className="text-base font-normal text-[var(--muted)]">
                /mo
              </span>
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">{p.blurb}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-[var(--muted)]">
              <li>{p.pageviews.toLocaleString()} pageviews / month</li>
              <li>
                {p.id === "starter"
                  ? "Up to 10 sites"
                  : "Unlimited sites (fair use)"}
              </li>
              <li>Conversions + funnels</li>
              <li>{p.id === "starter" ? "1 user" : "Client read-only seats"}</li>
            </ul>
            <button
              type="button"
              className="sp-btn sp-btn-primary mt-6 w-full"
              disabled={loading === p.id}
              onClick={() => checkout(p.id)}
            >
              {loading === p.id ? "…" : "Get started"}
            </button>
          </div>
        ))}
      </div>

      {msg && (
        <p className="mt-6 rounded-xl bg-[var(--bg)] p-4 text-sm">{msg}</p>
      )}

      <p className="mt-8 text-sm text-[var(--muted)]">
        Prefer to explore first?{" "}
        <Link href="/register" className="font-semibold text-[var(--brand)]">
          Create a free Developer account
        </Link>{" "}
        (generous local/dev quota) then upgrade from Billing.
      </p>

      <MarketingFooter />
    </main>
  );
}
