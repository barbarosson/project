/**
 * Same-origin relative redirect target (pathname + optional search), no open redirects.
 */
export function safeAuthRedirectTarget(raw: string | null | undefined): string {
  if (raw == null) return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  if (trimmed.includes("://") || trimmed.includes("\\") || trimmed.includes("@")) return "/";
  const [beforeHash] = trimmed.split("#");
  return beforeHash || "/";
}
