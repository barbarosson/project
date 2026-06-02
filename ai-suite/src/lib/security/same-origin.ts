import { publicSiteUrlFromEnv } from "@/lib/site-public-url";

function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/** True when Origin/Referer matches NEXT_PUBLIC_SITE_URL (production browser calls). */
export function isSameOriginRequest(req: Request): boolean {
  const siteHost = hostFromUrl(publicSiteUrlFromEnv());
  if (!siteHost) {
    return process.env.NODE_ENV !== "production";
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  if (!origin && !referer) return false;

  if (origin) {
    const oh = hostFromUrl(origin);
    if (!oh || oh !== siteHost) return false;
  }
  if (referer) {
    const rh = hostFromUrl(referer);
    if (!rh || rh !== siteHost) return false;
  }
  return true;
}
