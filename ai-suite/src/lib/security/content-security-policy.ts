/** Google Identity Services (Sign in with Google button / One Tap). */
const GOOGLE_GIS_ORIGIN = "https://accounts.google.com";

/**
 * Baseline CSP for Next.js + Supabase + GA4 + Google Identity Services.
 * Tighten over time; set ISENDAI_CSP_REPORT_ONLY=1 to test without blocking.
 */
export function buildContentSecurityPolicy(): string {
  const connectSrc = [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://www.googletagmanager.com",
    GOOGLE_GIS_ORIGIN,
  ].join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    [
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      GOOGLE_GIS_ORIGIN,
    ].join(" "),
    ["style-src 'self' 'unsafe-inline'", GOOGLE_GIS_ORIGIN].join(" "),
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    `frame-src 'self' ${GOOGLE_GIS_ORIGIN}`,
    "worker-src 'self'",
  ].join("; ");
}

export function cspHeaderValue(): { key: string; value: string } {
  const policy = buildContentSecurityPolicy();
  if (process.env.ISENDAI_CSP_REPORT_ONLY === "1") {
    return { key: "Content-Security-Policy-Report-Only", value: policy };
  }
  return { key: "Content-Security-Policy", value: policy };
}
