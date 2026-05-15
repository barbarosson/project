"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";
import { useI18n } from "@/i18n/i18n-provider";
import { interactiveClick } from "@/lib/premium-ui";
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
  const [signedInLabel, setSignedInLabel] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!isSupabaseBrowserConfigured(runtime)) return;
    const supabase = createSupabaseBrowserClient(runtime);
    if (!supabase) return;

    function labelFromUser(user: {
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    }): string {
      const email = user.email?.trim();
      if (email) return email;
      const meta = user.user_metadata ?? {};
      const name =
        (typeof meta.full_name === "string" && meta.full_name.trim()) ||
        (typeof meta.name === "string" && meta.name.trim()) ||
        "";
      if (name) return name;
      return t("auth.signedInFallback");
    }

    function setFromSession(
      session: { user?: { id?: string; email?: string | null; user_metadata?: Record<string, unknown> } } | null
    ) {
      const user = session?.user;
      setSignedInLabel(user?.id ? labelFromUser(user) : null);
    }

    function loadServerSessionHint() {
      void fetch("/api/me/wallet", { cache: "no-store", credentials: "same-origin" })
        .then((r) => r.json() as Promise<{ signed_in?: boolean; email?: string | null }>)
        .then((body) => {
          if (body.signed_in) {
            const label = body.email?.trim() || t("auth.signedInFallback");
            setSignedInLabel((prev) => prev ?? label);
          }
        })
        .catch(() => {
          /* ignore */
        });
    }

    void supabase.auth.getSession().then(({ data }) => {
      setFromSession(data.session);
      if (!data.session) loadServerSessionHint();
    });

    loadServerSessionHint();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setFromSession(session);
    });
    return () => sub.subscription.unsubscribe();
  }, [runtime, t]);

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

  if (signedInLabel) {
    const logoutBtn = (
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        title={signedInLabel}
        className={cn(
          interactiveClick,
          "inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.05] px-2 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-xl hover:border-violet-500/35 hover:bg-white/[0.09] disabled:opacity-60 sm:px-3 sm:py-2 sm:text-sm"
        )}
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
          className={cn(
            interactiveClick,
            "inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.05] px-2 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-xl hover:border-violet-500/35 hover:bg-white/[0.09] sm:px-3 sm:py-2 sm:text-sm"
          )}
          title={signedInLabel}
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
        interactiveClick,
        "inline-flex items-center rounded-lg border border-white/[0.12] bg-white/[0.05] px-2 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-xl hover:border-violet-500/35 hover:bg-white/[0.09] sm:px-3 sm:py-2 sm:text-sm",
        className
      )}
    >
      {t("nav.login")}
    </Link>
  );
}

