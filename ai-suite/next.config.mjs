import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import path from "path";
import { fileURLToPath } from "url";

import withSerwistInit from "@serwist/next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";

function serwistRevision() {
  const out = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" });
  const hash = out.stdout?.trim();
  return hash && out.status === 0 ? hash : crypto.randomUUID();
}

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: !isProduction,
  additionalPrecacheEntries: [{ url: "/~offline", revision: serwistRevision() }],
});

/** Keep in sync with src/lib/security/content-security-policy.ts */
const GOOGLE_GIS = "https://accounts.google.com";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com ${GOOGLE_GIS}`,
  `style-src 'self' 'unsafe-inline' ${GOOGLE_GIS}`,
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com ${GOOGLE_GIS}`,
  `frame-src 'self' ${GOOGLE_GIS}`,
  "worker-src 'self'",
].join("; ");

const cspHeaderKey =
  process.env.ISENDAI_CSP_REPORT_ONLY === "1"
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      { key: cspHeaderKey, value: contentSecurityPolicy },
    ];

    if (isProduction) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSerwist(nextConfig);

