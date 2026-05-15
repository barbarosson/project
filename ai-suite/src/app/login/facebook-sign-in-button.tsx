"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";
import { FacebookMark } from "@/components/oauth-brand-icons";
import { oauthCallbackRedirectUrl } from "@/lib/auth/oauth-callback-url";
import { cn } from "@/lib/utils";

export function FacebookSignInButton({ authCallbackUrl }: { authCallbackUrl: string }) {
  const { t } = useI18n();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [busy, setBusy] = React.useState(false);

  async function signInWithFacebook() {
    const supabase = createSupabaseBrowserClient(runtime);
    if (!supabase) {
      toast.error(t("login.missingSupabase"));
      return;
    }
    setBusy(true);
    try {
      // Do not pass `scopes` here — Supabase already requests email; duplicating
      // `email` breaks Facebook GDP consent and can abort the flow (scope shows twice).
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: oauthCallbackRedirectUrl(authCallbackUrl),
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.assign(data.url);
      }
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
        "border-[#1877F2]/35 hover:border-[#1877F2]/50"
      )}
      disabled={busy}
      onClick={() => void signInWithFacebook()}
    >
      <span className="inline-flex items-center justify-center gap-3">
        <FacebookMark className="size-5" />
        <span>{busy ? t("login.sending") : t("login.oauthFacebook")}</span>
      </span>
    </Button>
  );
}
