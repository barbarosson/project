"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { normalizeReferralCode } from "@/lib/referrals/code";
import { setReferralCookieClient } from "@/lib/referrals/ref-cookie";

/** Persists `?ref=CODE` from login/join URLs into a 30-day cookie for OAuth signups. */
export function LoginReferralCapture() {
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const ref = normalizeReferralCode(searchParams.get("ref"));
    if (ref) setReferralCookieClient(ref);
  }, [searchParams]);

  return null;
}
