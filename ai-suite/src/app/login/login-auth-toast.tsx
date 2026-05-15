"use client";

import * as React from "react";
import { toast } from "sonner";

import { useI18n } from "@/i18n/i18n-provider";

/** Shows a toast for `/login?error=…` then strips the query param from the URL. */
export function LoginAuthToast({
  error,
  detail: detailProp,
}: {
  error?: string | null;
  detail?: string | null;
}) {
  const { t } = useI18n();
  const shown = React.useRef(false);

  React.useEffect(() => {
    if (shown.current || !error) return;
    shown.current = true;
    const detail =
      detailProp ?? new URLSearchParams(window.location.search).get("detail");
    if (error === "auth") {
      toast.error(
        detail ? `${t("login.oauthCallbackFailed")} (${detail})` : t("login.oauthCallbackFailed")
      );
    } else if (error === "oauth") {
      toast.error(
        detail ? `${t("login.oauthProviderError")} (${detail})` : t("login.oauthProviderError")
      );
    } else {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    url.searchParams.delete("detail");
    const q = url.searchParams.toString();
    window.history.replaceState({}, "", `${url.pathname}${q ? `?${q}` : ""}`);
  }, [error, detailProp, t]);

  return null;
}
