/**
 * Restrict post-auth redirects to same-origin relative paths only
 * (prevents open redirects via absolute URLs).
 */
export function safeNext(raw: string | null | undefined): string {
  if (raw == null) return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  if (trimmed.includes("://") || trimmed.includes("\\")) return "/";
  if (trimmed.includes("@")) return "/";
  return trimmed;
}

/** Default when `next` query is missing (post-login → home). */
export const DEFAULT_POST_LOGIN_NEXT = "/";

export function resolvePostLoginNext(raw: string | null | undefined): string {
  if (raw == null || raw.trim() === "") return DEFAULT_POST_LOGIN_NEXT;
  return safeNext(raw);
}
