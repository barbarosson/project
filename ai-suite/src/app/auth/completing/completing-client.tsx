"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { OAuthRedirectScreen } from "@/components/auth/oauth-redirect-screen";
import { safeAuthRedirectTarget } from "@/lib/auth/safe-auth-destination";

const MIN_DISPLAY_MS = 1100;

export function OAuthCompletingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stepIndex, setStepIndex] = React.useState(0);

  const destination = safeAuthRedirectTarget(searchParams.get("to"));

  React.useEffect(() => {
    const t1 = window.setTimeout(() => setStepIndex(1), 420);
    const t2 = window.setTimeout(() => {
      router.replace(destination);
    }, MIN_DISPLAY_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [destination, router]);

  return <OAuthRedirectScreen mode="inbound" stepIndex={stepIndex} />;
}
