"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function AuthStatus({ className }: { className?: string }) {
  const [email, setEmail] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [enabled, setEnabled] = React.useState(true);

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setEnabled(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      await supabase.auth.signOut();
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-white/10 bg-slate-900/20 px-2 py-1.5 text-xs font-semibold text-slate-400 backdrop-blur-md sm:px-3 sm:py-2 sm:text-sm",
          className
        )}
        title="Supabase env vars are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart dev server."
      >
        Auth disabled
      </span>
    );
  }

  if (email) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Link
          href="/account"
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-slate-900/40 px-2 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-md hover:bg-slate-900/55 sm:px-3 sm:py-2 sm:text-sm"
          title={email}
        >
          <User className="size-4 text-violet-300" />
          Account
        </Link>
        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-slate-900/40 px-2 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-md hover:bg-slate-900/55 disabled:opacity-60 sm:px-3 sm:py-2 sm:text-sm"
        >
          <LogOut className="size-4 text-slate-300" />
          Logout
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className={cn(
        "inline-flex items-center rounded-md border border-white/10 bg-slate-900/40 px-2 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-md hover:bg-slate-900/55 sm:px-3 sm:py-2 sm:text-sm",
        className
      )}
    >
      Login
    </Link>
  );
}

