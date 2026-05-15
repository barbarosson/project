import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { pageMain } from "@/lib/page-layout";
import { cn } from "@/lib/utils";
import { glassInteractive, textGradientHero } from "@/lib/premium-ui";

import { UpdatePasswordForm } from "./update-password-form";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    redirect("/login?next=%2Fauth%2Fupdate-password");
  }

  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];

  return (
    <main className={pageMain("auth")}>
      <div className={cn("rounded-2xl p-6", glassInteractive)}>
        <h1 className={cn("text-2xl font-semibold tracking-tight sm:text-3xl", textGradientHero)}>
          {d["login.updatePasswordTitle"]}
        </h1>
        <p className="mt-2 text-sm text-slate-400">{d["login.updatePasswordSubtitle"]}</p>
        <div className="mt-6">
          <UpdatePasswordForm email={user.email ?? null} />
        </div>
        <p className="mt-6 text-center text-sm">
          <Link className="text-violet-300 hover:text-violet-200" href="/login">
            ← {d["nav.login"]}
          </Link>
        </p>
      </div>
    </main>
  );
}
