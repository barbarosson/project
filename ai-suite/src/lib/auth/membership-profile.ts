/** True when the user saved the membership profile form (Supabase `user_metadata`). */
export function isMembershipProfileComplete(userMetadata: unknown): boolean {
  if (!userMetadata || typeof userMetadata !== "object") return false;
  const m = userMetadata as Record<string, unknown>;
  return typeof m.profile_completed_at === "string" && m.profile_completed_at.length > 0;
}

/** After saving profile, return user to the page they were on (e.g. `/` or `/pricing`). */
export function hrefToCompleteMembershipProfileForCurrentPage(): string {
  if (typeof window === "undefined") return "/account/profile";
  const path = window.location.pathname + window.location.search;
  const next = path.startsWith("/") ? path : "/";
  return `/account/profile?next=${encodeURIComponent(next)}`;
}
