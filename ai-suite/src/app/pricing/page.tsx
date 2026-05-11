import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PricingPage() {
  const isProd = process.env.NODE_ENV === "production";
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pricing</h1>
          <p className="mt-2 text-sm text-slate-300">
            Credits (1 request = 1 credit) and subscriptions will be available soon.
          </p>
        </div>
        <Link className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950" href="/">
          Back home
        </Link>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { title: "Budget", price: "$1.00", desc: "For fast, cheap models." },
          { title: "Standard", price: "$1.49", desc: "Balanced quality & speed." },
          { title: "Premium", price: "$1.99", desc: "Best quality / reasoning." },
        ].map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md"
          >
            <p className="text-xs font-semibold text-slate-300">{p.title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{p.price}</p>
            <p className="mt-2 text-sm text-slate-300">{p.desc}</p>
            <p className="mt-4 text-xs text-slate-400">Includes your plan’s version limit.</p>
          </div>
        ))}
      </section>

      {!isProd ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md">
          <h2 className="text-sm font-semibold text-white">Dev mode</h2>
          <p className="mt-2 text-sm text-slate-300">
            Stripe is not connected yet. To test the full flow, you can top up credits locally:
          </p>
          <pre className="mt-3 overflow-auto rounded-xl border border-white/10 bg-slate-950/30 p-4 text-xs text-slate-200">
{`POST /api/dev/topup
Content-Type: application/json

{ "credits": 10 }`}
          </pre>
          <p className="mt-2 text-xs text-slate-400">
            This endpoint is disabled in production.
          </p>
        </section>
      ) : null}
    </main>
  );
}

