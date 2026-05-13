"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";
import { useI18n } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

type AuthStatusProps = {
  className?: string;
  /** On /account: show only log out (avoid duplicate “Account” link). */
  omitAccountLink?: boolean;
};

export function AuthStatus({ className, omitAccountLink }: AuthStatusProps) {
  const { t } = useI18n();
  const router = useRouter();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [email, setEmail] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!isSupabaseBrowserConfigured(runtime)) return;
    const supabase = createSupabaseBrowserClient(runtime);
    if (!supabase) return;

    function setFromSession(session: { user?: { email?: string | null } } | null) {
      setEmail(session?.user?.email ?? null);
    }

    void supabase.auth.getSession().then(({ data }) => {
      setFromSession(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setFromSession(session);
    });
    return () => sub.subscription.unsubscribe();
  }, [runtime]);

  async function signOut() {
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient(runtime);
      if (!supabase) return;
      await supabase.auth.signOut();
      router.refresh();
      router.push("/");
    } finally {
      setBusy(false);
    }
  }

  if (!isSupabaseBrowserConfigured(runtime)) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 py-1.5 text-xs font-semibold text-slate-400 backdrop-blur-xl sm:px-3 sm:py-2 sm:text-sm",
          className
        )}
        title={t("auth.disabledTitle")}
      >
        {t("auth.disabled")}
      </span>
    );
  }

  if (email) {
    const logoutBtn = (
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        title={email}
        className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.05] px-2 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-xl transition-all hover:border-violet-500/35 hover:bg-white/[0.09] disabled:opacity-60 sm:px-3 sm:py-2 sm:text-sm"
      >
        <LogOut className="size-4 text-indigo-400" strokeWidth={1.5} />
        {t("nav.logout")}
      </button>
    );

    if (omitAccountLink) {
      return <div className={cn("flex items-center gap-2", className)}>{logoutBtn}</div>;
    }

    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Link
          href="/account"
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.05] px-2 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-xl transition-all hover:border-violet-500/35 hover:bg-white/[0.09] sm:px-3 sm:py-2 sm:text-sm"
          title={email}
        >
          <User className="size-4 text-indigo-400" strokeWidth={1.5} />
          {t("nav.account")}
        </Link>
        {logoutBtn}
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className={cn(
        "inline-flex items-center rounded-lg border border-white/[0.12] bg-white/[0.05] px-2 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-xl transition-all hover:border-violet-500/35 hover:bg-white/[0.09] sm:px-3 sm:py-2 sm:text-sm",
        className
      )}
    >
      {t("nav.login")}
    </Link>
  );
}

