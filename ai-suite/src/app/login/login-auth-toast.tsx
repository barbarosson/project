"use client";

import * as React from "react";
import { toast } from "sonner";

import { useI18n } from "@/i18n/i18n-provider";

/** Shows a toast for `/login?error=…` then strips the query param from the URL. */
export function LoginAuthToast({ error }: { error?: string | null }) {
  const { t } = useI18n();
  const shown = React.useRef(false);

  React.useEffect(() => {
    if (shown.current || !error) return;
    shown.current = true;
    if (error === "auth") {
      toast.error(t("login.oauthCallbackFailed"));
    } else if (error === "oauth") {
      toast.error(t("login.oauthProviderError"));
    } else {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    url.searchParams.delete("detail");
    const q = url.searchParams.toString();
    window.history.replaceState({}, "", `${url.pathname}${q ? `?${q}` : ""}`);
  }, [error, t]);

  return null;
}
