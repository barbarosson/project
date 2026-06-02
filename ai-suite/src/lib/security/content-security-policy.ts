/**
 * Baseline CSP for Next.js + Supabase + optional Google Analytics.
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
  ].join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
  ].join("; ");
}

export function cspHeaderValue(): { key: string; value: string } {
  const policy = buildContentSecurityPolicy();
  if (process.env.ISENDAI_CSP_REPORT_ONLY === "1") {
    return { key: "Content-Security-Policy-Report-Only", value: policy };
  }
  return { key: "Content-Security-Policy", value: policy };
}
