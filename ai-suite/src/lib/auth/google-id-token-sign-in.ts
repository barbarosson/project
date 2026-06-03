import type { SupabaseClient } from "@supabase/supabase-js";

import { acquireGoogleIdToken } from "@/lib/auth/google-gis";
import { resolvePostLoginDestination } from "@/lib/auth/resolve-post-login-destination";

export type GoogleIdTokenSignInResult =
  | { ok: true; completingPath: string }
  | { ok: false; message: string; fallbackToHostedOAuth: boolean };

export async function signInWithGoogleIdToken(
  supabase: SupabaseClient,
  clientId: string,
  nextAfterAuth: string
): Promise<GoogleIdTokenSignInResult> {
  let token: string;
  try {
    token = await acquireGoogleIdToken(clientId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Google sign-in failed";
    const fallback =
      msg.startsWith("google_prompt_unavailable:") ||
      /script failed|failed to load|not ready|Content Security|csp/i.test(msg) ||
      /not displayed|skipped|blocked|popup/i.test(msg);
    return { ok: false, message: msg, fallbackToHostedOAuth: fallback };
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token,
  });

  if (error) {
    const fallback =
      /nonce|invalid|client/i.test(error.message) &&
      !/disabled|provider/i.test(error.message);
    return { ok: false, message: error.message, fallbackToHostedOAuth: fallback };
  }

  const user = data.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) {
    return { ok: false, message: "No user after Google sign-in", fallbackToHostedOAuth: false };
  }

  try {
    await fetch("/api/auth/bootstrap", { method: "POST", credentials: "same-origin" });
  } catch {
    // non-fatal — entitlements may catch up later
  }

  const destination = resolvePostLoginDestination(user, nextAfterAuth);
  const completingPath = `/auth/completing?to=${encodeURIComponent(destination)}`;

  return { ok: true, completingPath };
}
