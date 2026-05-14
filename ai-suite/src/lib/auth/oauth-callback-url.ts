import { safeNext } from "./safe-next";
import { publicBrowserSiteOrigin } from "@/lib/site-public-url";

/** Server passes full callback URL; client falls back to canonical origin + `next` query. */
export function oauthCallbackRedirectUrl(serverCallbackUrl: string): string {
  const t = serverCallbackUrl.trim();
  if (t) return t;
  if (typeof window === "undefined") return "";
  const next = safeNext(new URLSearchParams(window.location.search).get("next"));
  const origin = publicBrowserSiteOrigin();
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
