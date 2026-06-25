"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Loader2 } from "lucide-react";
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
  variant = "page",
}: {
  clientId: string;
  nextAfterAuth: string;
  variant?: "inline" | "page";
}) {
  const { t, locale } = useI18n();
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
    setReady(false);

    void mountGoogleSignInButton(
      host,
      clientId,
      {
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
            router.replace(result.destination);
            router.refresh();
            return;
          }
          if (result.fallbackToHostedOAuth) {
            window.location.assign(`${buildOAuthConnectingHref("google", nextAfterAuth)}&hosted=1`);
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
    },
      locale
    ).then((dispose) => {
      if (cancelled) dispose();
      else cleanup = dispose;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [clientId, locale, nextAfterAuth, router, runtime, t]);

  if (variant === "inline") {
    return (
      <div className={cn("w-full", busy && "pointer-events-none opacity-80")}>
        <div
          className={cn(
            "flex min-h-[44px] w-full items-center justify-center overflow-hidden rounded-xl",
            !ready && "animate-pulse bg-white/[0.04] light:bg-slate-100"
          )}
          ref={buttonHostRef}
          aria-busy={!ready || busy}
        />
        {busy ? (
          <p className="mt-2 flex items-center justify-center gap-2 text-center text-xs text-violet-200/90 light:text-violet-800">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            {t("auth.connecting.googleSigningIn")}
          </p>
        ) : (
          <p className="mt-2 text-center text-xs leading-relaxed text-slate-400 light:text-slate-600">
            {t("login.googleTrust")}
          </p>
        )}
      </div>
    );
  }

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
