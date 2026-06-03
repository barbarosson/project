import type { Provider } from "@supabase/auth-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { INSTAGRAM_OAUTH_PROVIDER, INSTAGRAM_OAUTH_SCOPES } from "@/lib/auth/instagram-oauth";
import { oauthCallbackRedirectUrl } from "@/lib/auth/oauth-callback-url";

export type StartOAuthSignInResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

export async function startOAuthSignIn(
  supabase: SupabaseClient,
  provider: Provider,
  serverCallbackUrl: string
): Promise<StartOAuthSignInResult> {
  const redirectTo = oauthCallbackRedirectUrl(serverCallbackUrl);
  const baseOptions = { redirectTo };

  if (provider === "google") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        ...baseOptions,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) return { ok: false, message: error.message };
    if (!data?.url) return { ok: false, message: "No redirect URL" };
    return { ok: true, url: data.url };
  }

  if (provider === INSTAGRAM_OAUTH_PROVIDER) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: INSTAGRAM_OAUTH_PROVIDER,
      options: {
        ...baseOptions,
        scopes: INSTAGRAM_OAUTH_SCOPES,
      },
    });
    if (error) return { ok: false, message: error.message };
    if (!data?.url) return { ok: false, message: "No redirect URL" };
    return { ok: true, url: data.url };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: baseOptions,
  });
  if (error) return { ok: false, message: error.message };
  if (!data?.url) return { ok: false, message: "No redirect URL" };
  return { ok: true, url: data.url };
}
