"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GoogleMark } from "@/components/oauth-brand-icons";
import { useI18n } from "@/i18n/i18n-provider";
import { buildOAuthConnectingHref } from "@/lib/auth/oauth-connecting";
import { getGoogleOAuthClientId } from "@/lib/auth/google-gis";
import { signInWithGoogleIdToken } from "@/lib/auth/google-id-token-sign-in";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";
import { cn } from "@/lib/utils";

export function GoogleSignInButton({ nextAfterAuth = "/" }: { nextAfterAuth?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [busy, setBusy] = React.useState(false);
  const googleClientId = getGoogleOAuthClientId();

  async function handleClick() {
    const supabase = createSupabaseBrowserClient(runtime);
    if (!supabase) {
      toast.error(t("login.missingSupabase"));
      return;
    }

    if (!googleClientId) {
      router.push(buildOAuthConnectingHref("google", nextAfterAuth));
      return;
    }

    setBusy(true);
    try {
      const result = await signInWithGoogleIdToken(supabase, googleClientId, nextAfterAuth);
      if (result.ok) {
        router.push(result.completingPath);
        return;
      }
      if (result.fallbackToHostedOAuth) {
        router.push(buildOAuthConnectingHref("google", nextAfterAuth));
        return;
      }
      toast.error(result.message || t("login.oauthFailed"));
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
      onClick={() => void handleClick()}
    >
      <span className="inline-flex items-center justify-center gap-3">
        <GoogleMark className="size-5" />
        <span>{busy ? t("login.sending") : t("login.oauthGoogle")}</span>
      </span>
    </Button>
  );
}
