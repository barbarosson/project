"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";
import { GoogleMark } from "@/components/oauth-brand-icons";
import { cn } from "@/lib/utils";

export function GoogleSignInButton() {
  const { t } = useI18n();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [busy, setBusy] = React.useState(false);

  async function signInWithGoogle() {
    const supabase = createSupabaseBrowserClient(runtime);
    if (!supabase) {
      toast.error(t("login.missingSupabase"));
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/claim`,
        },
      });
      if (error) throw error;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("login.oauthFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-12 w-full justify-center border-white/15 bg-slate-950/40 text-sm font-semibold text-slate-100 hover:bg-slate-950/60",
        "border-emerald-500/25"
      )}
      disabled={busy}
      onClick={() => void signInWithGoogle()}
    >
      <span className="inline-flex items-center justify-center gap-3">
        <GoogleMark className="size-5" />
        <span>{busy ? t("login.sending") : t("login.oauthGoogle")}</span>
      </span>
    </Button>
  );
}
