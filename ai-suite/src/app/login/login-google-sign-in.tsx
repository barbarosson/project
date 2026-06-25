"use client";

import * as React from "react";

import { GoogleSignInPanel } from "@/components/auth/google-sign-in-panel";
import { GoogleSignInButton } from "@/app/login/google-sign-in-button";
import { useI18n } from "@/i18n/i18n-provider";
import {
  getGoogleOAuthClientId,
  hasInvalidGoogleOAuthClientIdEnv,
  loadGoogleGsiScript,
} from "@/lib/auth/google-gis";

export function LoginGoogleSignIn({ nextAfterAuth = "/" }: { nextAfterAuth?: string }) {
  const { locale } = useI18n();
  const clientId = getGoogleOAuthClientId();
  const useInline = Boolean(clientId) && !hasInvalidGoogleOAuthClientIdEnv();

  React.useEffect(() => {
    if (useInline && clientId) void loadGoogleGsiScript(locale).catch(() => undefined);
  }, [useInline, clientId, locale]);

  if (useInline && clientId) {
    return <GoogleSignInPanel variant="inline" clientId={clientId} nextAfterAuth={nextAfterAuth} />;
  }

  if (hasInvalidGoogleOAuthClientIdEnv()) {
    return <GoogleSignInButton nextAfterAuth={nextAfterAuth} />;
  }

  return <GoogleSignInButton nextAfterAuth={nextAfterAuth} />;
}
