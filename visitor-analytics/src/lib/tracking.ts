import { createHash } from "crypto";

export function truncateIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const cleaned = ip.split(",")[0]?.trim() ?? ip;
  if (cleaned.includes(":")) {
    // IPv6: keep first 4 hextets
    const parts = cleaned.split(":");
    return parts.slice(0, 4).join(":") + "::";
  }
  const octets = cleaned.split(".");
  if (octets.length === 4) {
    return `${octets[0]}.${octets[1]}.${octets[2]}.0`;
  }
  return cleaned;
}

export function deviceClass(ua: string | null | undefined): string {
  if (!ua) return "unknown";
  const lower = ua.toLowerCase();
  if (/ipad|tablet|kindle|playbook|silk|(android(?!.*mobile))/.test(lower)) {
    return "tablet";
  }
  if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(lower)) {
    return "mobile";
  }
  return "desktop";
}

export function cookielessVisitorId(opts: {
  ipTruncated: string | null;
  userAgent: string | null;
  day: string;
  siteId: string;
}) {
  const raw = [
    opts.siteId,
    opts.ipTruncated ?? "",
    opts.userAgent ?? "",
    opts.day,
  ].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

export function parseUtm(url: string | undefined) {
  if (!url) return { utmSource: null, utmMedium: null, utmCampaign: null };
  try {
    const u = new URL(url, "https://example.invalid");
    return {
      utmSource: u.searchParams.get("utm_source"),
      utmMedium: u.searchParams.get("utm_medium"),
      utmCampaign: u.searchParams.get("utm_campaign"),
    };
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null };
  }
}

export function ymd(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function clientIp(headers: Headers): string | null {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    null
  );
}
