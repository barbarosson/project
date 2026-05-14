/**
 * Public site origin for auth redirects (password reset, OAuth fallback, etc.).
 * Prefer NEXT_PUBLIC_SITE_URL (set on Netlify to https://isendai.netlify.app) so
 * email links point at production even if the request was made from localhost.
 */
export function publicBrowserSiteOrigin(): string {
  const env =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "" : "";
  if (env.startsWith("http://") || env.startsWith("https://")) {
    return env.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}
