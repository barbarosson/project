"use client";

import * as React from "react";
import type { Provider } from "@supabase/auth-js";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";
import { OauthProviderMark } from "@/components/oauth-brand-icons";
import { cn } from "@/lib/utils";

type Row = {
  provider: Provider;
  labelKey: string;
};

const OAUTH_ROWS: Row[] = [
  { provider: "apple", labelKey: "login.oauthApple" },
  { provider: "x", labelKey: "login.oauthX" },
  { provider: "linkedin_oidc", labelKey: "login.oauthLinkedin" },
  { provider: "custom:tiktok" as Provider, labelKey: "login.oauthTiktok" },
];

export function OAuthLoginButtons() {
  const { t } = useI18n();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [busy, setBusy] = React.useState<Provider | null>(null);

  async function signIn(provider: Provider) {
    const supabase = createSupabaseBrowserClient(runtime);
    if (!supabase) {
      toast.error(t("login.missingSupabase"));
      return;
    }
    setBusy(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/claim`,
        },
      });
      if (error) throw error;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("login.oauthFailed"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-3">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t("login.oauthOtherTitle")}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {OAUTH_ROWS.map((row) => (
          <Button
            key={row.provider}
            type="button"
            variant="outline"
            className={cn(
              "h-11 justify-center border-white/15 bg-slate-950/40 text-sm font-semibold text-slate-100 hover:bg-slate-950/60",
              row.provider === "apple" && "border-white/20",
              row.provider === "x" && "border-sky-500/30",
              (row.provider === "linkedin_oidc" || String(row.provider).includes("tiktok")) &&
                "border-sky-600/30"
            )}
            disabled={busy !== null}
            onClick={() => void signIn(row.provider)}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <OauthProviderMark provider={row.provider} />
              <span className="truncate">
                {busy === row.provider ? t("login.sending") : t(row.labelKey)}
              </span>
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
