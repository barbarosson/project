import { safeNext } from "./safe-next";

/** Server passes full callback URL; client falls back to current origin + `next` query. */
export function oauthCallbackRedirectUrl(serverCallbackUrl: string): string {
  const t = serverCallbackUrl.trim();
  if (t) return t;
  if (typeof window === "undefined") return "";
  const next = safeNext(new URLSearchParams(window.location.search).get("next"));
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
