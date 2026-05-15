"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n-provider";
import { INSTAGRAM_OAUTH_PROVIDER, INSTAGRAM_OAUTH_SCOPES } from "@/lib/auth/instagram-oauth";
import { oauthCallbackRedirectUrl } from "@/lib/auth/oauth-callback-url";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";
import { InstagramMark } from "@/components/oauth-brand-icons";
import { cn } from "@/lib/utils";

export function InstagramSignInButton({ authCallbackUrl }: { authCallbackUrl: string }) {
  const { t } = useI18n();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [busy, setBusy] = React.useState(false);

  async function signInWithInstagram() {
    const supabase = createSupabaseBrowserClient(runtime);
    if (!supabase) {
      toast.error(t("login.missingSupabase"));
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: INSTAGRAM_OAUTH_PROVIDER,
        options: {
          redirectTo: oauthCallbackRedirectUrl(authCallbackUrl),
          scopes: INSTAGRAM_OAUTH_SCOPES,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("login.oauthFailed");
      if (/custom:instagram|provider|not enabled|unsupported/i.test(msg)) {
        toast.error(t("login.oauthInstagramNotConfigured"));
      } else {
        toast.error(msg);
      }
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
        "border-fuchsia-500/35 hover:border-fuchsia-500/50"
      )}
      disabled={busy}
      onClick={() => void signInWithInstagram()}
    >
      <span className="inline-flex items-center justify-center gap-3">
        <InstagramMark className="size-5" />
        <span>{busy ? t("login.sending") : t("login.oauthInstagram")}</span>
      </span>
    </Button>
  );
}
