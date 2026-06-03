import type { User } from "@supabase/supabase-js";

import { isMembershipProfileComplete } from "@/lib/auth/membership-profile";
import { safeAuthRedirectTarget } from "@/lib/auth/safe-auth-destination";
import { safeNext } from "@/lib/auth/safe-next";

/** Same rules as `/auth/callback` destination (client-safe). */
export function resolvePostLoginDestination(user: User, nextRaw: string | undefined): string {
  const nextPath = safeNext(nextRaw);

  if (
    nextPath === "/auth/update-password" ||
    nextPath.startsWith("/auth/update-password/")
  ) {
    return safeAuthRedirectTarget(nextPath);
  }

  if (!isMembershipProfileComplete(user.user_metadata)) {
    const afterProfile = nextPath && nextPath !== "/" ? nextPath : "/";
    return `/account/profile?next=${encodeURIComponent(afterProfile)}`;
  }

  const dest = new URL(nextPath || "/", "http://local");
  if (!user.email?.trim()) {
    dest.searchParams.set("oauth_email", "missing");
  }
  dest.searchParams.set("auth_sync", "1");
  return safeAuthRedirectTarget(dest.pathname + dest.search);
}
