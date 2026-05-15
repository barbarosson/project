/** Canonical site URL from env (no trailing slash), or empty if unset / invalid. */
export function publicSiteUrlFromEnv(): string {
  const env =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "" : "";
  if (env.startsWith("http://") || env.startsWith("https://")) {
    return env.replace(/\/+$/, "");
  }
  return "";
}

/**
 * Public site origin for auth redirects (password reset, OAuth fallback, etc.).
 * Prefer NEXT_PUBLIC_SITE_URL (set on Netlify) so links match production.
 */
export function publicBrowserSiteOrigin(): string {
  const fromEnv = publicSiteUrlFromEnv();
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

type HeaderGet = { get(name: string): string | null };

/** Server: prefer NEXT_PUBLIC_SITE_URL for OAuth/email callback base; else request Host. */
export function resolveAuthPublicOrigin(requestHeaders: HeaderGet): string {
  const fromEnv = publicSiteUrlFromEnv();
  if (fromEnv) return fromEnv;
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}`.replace(/\/+$/, "") : "";
}
