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
 * OAuth `redirectTo` must use the same origin as the page where the user clicked sign-in
 * (PKCE verifier cookie). Prefer the browser origin over NEXT_PUBLIC_SITE_URL on the client.
 */
export function oauthCallbackRedirectUrl(serverCallbackUrl: string): string {
  if (typeof window !== "undefined") {
    const fromQuery = safeNext(new URLSearchParams(window.location.search).get("next"));
    const fromServer = nextFromCallbackUrl(serverCallbackUrl);
    const next =
      fromQuery !== "/" ? fromQuery : fromServer !== "/" ? fromServer : "/";
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  }
  return serverCallbackUrl.trim();
}
