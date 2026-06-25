import { safeNext } from "./safe-next";

function nextFromCallbackUrl(serverCallbackUrl: string): string {
  const t = serverCallbackUrl.trim();
  if (!t) return "/";
  try {
    const fromServer = new URL(t).searchParams.get("next");
    if (fromServer) return safeNext(fromServer);
  } catch {
    /* ignore */
  }
  return "/";
}

/**
 * Auth email/OAuth callbacks must use the same origin as the page where the user started
 * (PKCE verifier cookie). Prefer the browser origin over NEXT_PUBLIC_SITE_URL on the client.
 */
export function authCallbackRedirectUrl(
  serverCallbackUrl: string,
  nextPath: string = "/"
): string {
  const next = safeNext(nextPath);
  if (typeof window !== "undefined") {
    const fromQuery = safeNext(new URLSearchParams(window.location.search).get("next"));
    const fromServer = nextFromCallbackUrl(serverCallbackUrl);
    const resolvedNext =
      fromQuery !== "/" ? fromQuery : next !== "/" ? next : fromServer !== "/" ? fromServer : "/";
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(resolvedNext)}`;
  }
  const trimmed = serverCallbackUrl.trim();
  if (trimmed) {
    try {
      const url = new URL(trimmed);
      url.searchParams.set("next", next);
      return url.toString();
    } catch {
      /* fall through */
    }
  }
  return trimmed;
}

/** @deprecated alias — use {@link authCallbackRedirectUrl} */
export function oauthCallbackRedirectUrl(serverCallbackUrl: string): string {
  return authCallbackRedirectUrl(serverCallbackUrl, nextFromCallbackUrl(serverCallbackUrl));
}
