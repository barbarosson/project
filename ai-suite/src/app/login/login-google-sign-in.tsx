"use client";

import * as React from "react";

import { GoogleSignInPanel } from "@/components/auth/google-sign-in-panel";
import { GoogleSignInButton } from "@/app/login/google-sign-in-button";
import {
  getGoogleOAuthClientId,
  hasInvalidGoogleOAuthClientIdEnv,
  loadGoogleGsiScript,
} from "@/lib/auth/google-gis";

export function LoginGoogleSignIn({ nextAfterAuth = "/" }: { nextAfterAuth?: string }) {
  const clientId = getGoogleOAuthClientId();
  const useInline = Boolean(clientId) && !hasInvalidGoogleOAuthClientIdEnv();

  React.useEffect(() => {
    if (useInline && clientId) void loadGoogleGsiScript().catch(() => undefined);
  }, [useInline, clientId]);

  if (useInline && clientId) {
    return <GoogleSignInPanel variant="inline" clientId={clientId} nextAfterAuth={nextAfterAuth} />;
  }

  if (hasInvalidGoogleOAuthClientIdEnv()) {
    return <GoogleSignInButton nextAfterAuth={nextAfterAuth} />;
  }

  return <GoogleSignInButton nextAfterAuth={nextAfterAuth} />;
}
