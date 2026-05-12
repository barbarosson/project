import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { cn } from "@/lib/utils";
import { glassInteractive, textGradientHero } from "@/lib/premium-ui";
import { safeNext } from "@/lib/auth/safe-next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next ?? undefined);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/account/profile?next=${encodeURIComponent(next)}`)}`);
  }

  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];

  const meta =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, unknown>)
      : {};

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={cn("text-2xl font-semibold tracking-tight sm:text-3xl", textGradientHero)}>
            {d["profile.title"]}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{d["profile.subtitle"]}</p>
        </div>
        <Link
          className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm text-slate-200 backdrop-blur-xl transition-all hover:border-violet-500/35 hover:bg-white/[0.07]"
          href="/account"
        >
          {d["profile.backToAccount"]}
        </Link>
      </div>

      <section className={cn("mt-6 rounded-2xl p-6", glassInteractive)}>
        <ProfileForm nextPath={next} email={user.email ?? ""} initialMeta={meta} />
      </section>
    </main>
  );
}
