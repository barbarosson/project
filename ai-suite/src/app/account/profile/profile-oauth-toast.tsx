"use client";

import * as React from "react";
import { toast } from "sonner";

import { useI18n } from "@/i18n/i18n-provider";

/** Warn when Facebook OAuth did not return an email (`?oauth_email=missing`). */
export function ProfileOauthToast({ oauthEmail }: { oauthEmail?: string | null }) {
  const { t } = useI18n();
  const shown = React.useRef(false);

  React.useEffect(() => {
    if (shown.current || oauthEmail !== "missing") return;
    shown.current = true;
    toast.warning(t("profile.oauthEmailMissing"));
    const url = new URL(window.location.href);
    url.searchParams.delete("oauth_email");
    const q = url.searchParams.toString();
    window.history.replaceState({}, "", `${url.pathname}${q ? `?${q}` : ""}`);
  }, [oauthEmail, t]);

  return null;
}
