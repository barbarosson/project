import { safeNext } from "./safe-next";

/** Default `next` when auth params land on `/` or `/login` without an explicit `next`. */
export function authCallbackNextFallback(pathname: string): string {
  if (pathname === "/" || pathname === "/login") return "/";
  return safeNext(pathname);
}

export function isPkceAuthExchangeError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("code verifier") ||
    lower.includes("pkce") ||
    lower.includes("invalid flow state") ||
    lower.includes("both auth code and code verifier")
  );
}

export function authCallbackErrorDetail(message: string): string {
  if (isPkceAuthExchangeError(message)) return "pkce_mismatch";
  const lower = message.toLowerCase();
  if (lower.includes("expired") || lower.includes("otp_expired")) return "link_expired";
  return message.slice(0, 200);
}
