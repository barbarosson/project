"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { useI18n } from "@/i18n/i18n-provider";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";
import { interactiveClick } from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
  variant?: "header" | "outline";
  showIcon?: boolean;
};

export function SignOutButton({
  className,
  variant = "outline",
  showIcon = true,
}: SignOutButtonProps) {
  const { t } = useI18n();
  const router = useRouter();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [busy, setBusy] = React.useState(false);

  async function signOut() {
    if (!isSupabaseBrowserConfigured(runtime)) return;
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

  const headerClass = cn(
    interactiveClick,
    "inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/[0.12] bg-white/[0.05] px-1.5 py-1 text-xs font-semibold text-slate-200 backdrop-blur-xl hover:border-violet-500/35 hover:bg-white/[0.09] sm:gap-1.5 sm:px-2 sm:py-1.5 sm:text-sm"
  );

  const outlineClass = cn(
    interactiveClick,
    "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/35 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-100 hover:border-rose-400/55 hover:bg-rose-500/15 light:border-rose-300 light:bg-rose-50 light:text-rose-900 light:hover:bg-rose-100"
  );

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      disabled={busy}
      aria-label={t("nav.logout")}
      title={t("nav.logout")}
      className={cn(
        variant === "header" ? headerClass : outlineClass,
        "disabled:opacity-60",
        className
      )}
    >
      {showIcon ? <LogOut className="size-4 shrink-0" strokeWidth={1.5} aria-hidden /> : null}
      <span>{busy ? t("account.signingOut") : t("nav.logout")}</span>
    </button>
  );
}
