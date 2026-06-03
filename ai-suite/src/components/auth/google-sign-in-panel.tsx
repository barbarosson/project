"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { useI18n } from "@/i18n/i18n-provider";
import { mountGoogleSignInButton } from "@/lib/auth/google-gis";
import { finishGoogleSignInFromToken } from "@/lib/auth/google-id-token-sign-in";
import { buildOAuthConnectingHref } from "@/lib/auth/oauth-connecting";
import { pageBackLink, pageSubtitle } from "@/lib/premium-ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseBrowserRuntimeConfig } from "@/lib/supabase/browser-config-context";
import { cn } from "@/lib/utils";

export function GoogleSignInPanel({
  clientId,
  nextAfterAuth,
}: {
  clientId: string;
  nextAfterAuth: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const runtime = useSupabaseBrowserRuntimeConfig();
  const buttonHostRef = React.useRef<HTMLDivElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const host = buttonHostRef.current;
    if (!host) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void mountGoogleSignInButton(host, clientId, {
      onCredential: (token) => {
        if (cancelled) return;
        const supabase = createSupabaseBrowserClient(runtime);
        if (!supabase) {
          toast.error(t("login.missingSupabase"));
          return;
        }
        setBusy(true);
        void finishGoogleSignInFromToken(supabase, token, nextAfterAuth).then((result) => {
          setBusy(false);
          if (result.ok) {
            router.push(result.completingPath);
            return;
          }
          if (result.fallbackToHostedOAuth) {
            const hosted = `${buildOAuthConnectingHref("google", nextAfterAuth)}&hosted=1`;
            window.location.assign(hosted);
            return;
          }
          toast.error(result.message || t("login.oauthFailed"));
        });
      },
      onReady: () => {
        if (!cancelled) setReady(true);
      },
      onError: () => {
        if (!cancelled) toast.error(t("login.oauthFailed"));
      },
    }).then((dispose) => {
      if (cancelled) dispose();
      else cleanup = dispose;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [clientId, nextAfterAuth, router, runtime, t]);

  return (
    <div
      className={cn(
        "mx-auto mt-6 w-full max-w-md rounded-2xl border border-white/[0.1] bg-slate-950/50 p-6 sm:p-8",
        "light:border-slate-300/70 light:bg-white/90 light:shadow-lg",
        busy && "pointer-events-none opacity-70"
      )}
    >
      <p className={cn(pageSubtitle, "text-center text-pretty")}>{t("auth.connecting.googleHint")}</p>

      <div
        className={cn(
          "mt-6 flex min-h-[52px] w-full items-center justify-center",
          !ready && "animate-pulse rounded-lg bg-white/[0.06] light:bg-slate-200"
        )}
        ref={buttonHostRef}
        aria-busy={!ready || busy}
      />

      {busy ? (
        <p className="mt-4 text-center text-sm text-violet-200/90 light:text-violet-900">
          {t("auth.connecting.googleSigningIn")}
        </p>
      ) : null}

      <p className="mt-6 text-center text-xs text-slate-400 light:text-slate-600">
        <Link className={pageBackLink} href={`/login?next=${encodeURIComponent(nextAfterAuth)}`}>
          ← {t("auth.connecting.googleBackLogin")}
        </Link>
      </p>
    </div>
  );
}
