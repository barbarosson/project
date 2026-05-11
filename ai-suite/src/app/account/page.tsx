import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/");

  const { data: ent } = await supabase
    .schema("isendai")
    .from("entitlements")
    .select("credits_balance,max_versions_per_request,plan_id,plan_status,current_period_end")
    .eq("owner_type", "user")
    .eq("owner_id", user.id)
    .maybeSingle();

  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];

  const { data: requests } = await supabase
    .schema("isendai")
    .from("requests")
    .select("id,tool_id,model_id,created_at,credits_charged,max_versions")
    .eq("owner_type", "user")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
          <p className="mt-1 text-sm text-slate-300">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-md border border-white/10 bg-slate-900/40 px-4 py-2 text-sm text-slate-200"
            href="/account/profile"
          >
            {d["profile.editLink"]}
          </Link>
          <Link
            className="rounded-md border border-white/10 bg-slate-900/40 px-4 py-2 text-sm text-slate-200"
            href="/claim"
          >
            Link guest data
          </Link>
          <Link
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            href="/"
          >
            Back home
          </Link>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md">
        <h2 className="text-sm font-semibold text-white">Credits</h2>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {ent?.credits_balance ?? 0}
        </p>
        <p className="mt-2 text-sm text-slate-300">
          Versions per request: <span className="font-semibold text-white">{ent?.max_versions_per_request ?? 5}</span>
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Recent requests</h2>
          <span className="text-xs text-slate-400">{requests?.length ?? 0}</span>
        </div>

        {requests && requests.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {requests.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-white">{r.tool_id}</p>
                    <Link className="text-xs text-violet-300 hover:text-violet-200" href={`/request/${r.id}`}>
                      Open
                    </Link>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-400">Model: {r.model_id}</p>
                <p className="mt-2 text-xs text-slate-300">
                  Charged: {r.credits_charged} credit · Max versions: {r.max_versions}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">No requests yet.</p>
        )}
      </section>
    </main>
  );
}

