"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { GoogleSignInPanel } from "@/components/auth/google-sign-in-panel";
import { OAuthRedirectScreen } from "@/components/auth/oauth-redirect-screen";
import { useI18n } from "@/i18n/i18n-provider";
import {
  connectingSlugToProvider,
  type OAuthConnectingSlug,
} from "@/lib/auth/oauth-connecting";
import {
  getGoogleOAuthClientId,
  hasInvalidGoogleOAuthClientIdEnv,
} from "@/lib/auth/google-gis";
import { safeNext } from "@/lib/auth/safe-next";
import { startOAuthSignIn } from "@/lib/auth/start-oauth-sign-in";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";

const REDIRECT_DELAY_MS = 480;

export function OAuthConnectingClient() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const [stepIndex, setStepIndex] = React.useState(0);
  const started = React.useRef(false);

  const slug = (searchParams.get("provider")?.trim().toLowerCase() ?? "") as OAuthConnectingSlug;
  const provider = connectingSlugToProvider(slug);
  const nextPath = safeNext(searchParams.get("next"));
  const forceHosted = searchParams.get("hosted") === "1";
  const googleClientId = getGoogleOAuthClientId();
  const useGooglePanel =
    slug === "google" && Boolean(googleClientId) && !forceHosted && !hasInvalidGoogleOAuthClientIdEnv();

  React.useEffect(() => {
    if (useGooglePanel) return;
    if (started.current) return;
    if (!provider) {
      router.replace("/login?error=oauth");
      return;
    }
    started.current = true;

    const serverCallback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const supabase = createSupabaseBrowserClient(runtime);
    if (!supabase) {
      toast.error(t("login.missingSupabase"));
      router.replace("/login");
      return;
    }

    const timer = window.setTimeout(() => setStepIndex(1), REDIRECT_DELAY_MS);

    void (async () => {
      const result = await startOAuthSignIn(supabase, provider, serverCallback);
      if (!result.ok) {
        window.clearTimeout(timer);
        const msg = result.message;
        if (/custom:instagram|provider|not enabled|unsupported/i.test(msg)) {
          toast.error(t("login.oauthInstagramNotConfigured"));
        } else {
          toast.error(msg || t("login.oauthFailed"));
        }
        router.replace("/login?error=oauth");
        return;
      }
      await new Promise((r) => setTimeout(r, REDIRECT_DELAY_MS));
      window.location.assign(result.url);
    })();

    return () => window.clearTimeout(timer);
  }, [provider, nextPath, router, runtime, slug, t, useGooglePanel]);

  if (!provider) {
    return <OAuthRedirectScreen mode="outbound" providerSlug={null} stepIndex={0} />;
  }

  if (useGooglePanel && googleClientId) {
    return (
      <>
        <OAuthRedirectScreen mode="outbound" providerSlug="google" stepIndex={1} />
        <GoogleSignInPanel clientId={googleClientId} nextAfterAuth={nextPath} />
      </>
    );
  }

  return <OAuthRedirectScreen mode="outbound" providerSlug={slug} stepIndex={stepIndex} />;
}
