import type { Provider } from "@supabase/auth-js";

import { INSTAGRAM_OAUTH_PROVIDER } from "@/lib/auth/instagram-oauth";
import { safeNext } from "@/lib/auth/safe-next";

export type OAuthConnectingSlug =
  | "google"
  | "facebook"
  | "apple"
  | "x"
  | "linkedin"
  | "instagram"
  | "tiktok";

const SLUG_TO_PROVIDER: Record<OAuthConnectingSlug, Provider> = {
  google: "google",
  facebook: "facebook",
  apple: "apple",
  x: "x",
  linkedin: "linkedin_oidc",
  instagram: INSTAGRAM_OAUTH_PROVIDER,
  tiktok: "custom:tiktok" as Provider,
};

export function providerToConnectingSlug(provider: Provider): OAuthConnectingSlug | null {
  const id = String(provider);
  if (id === "google") return "google";
  if (id === "facebook") return "facebook";
  if (id === "apple") return "apple";
  if (id === "x") return "x";
  if (id === "linkedin_oidc") return "linkedin";
  if (id === INSTAGRAM_OAUTH_PROVIDER) return "instagram";
  if (id.includes("tiktok")) return "tiktok";
  return null;
}

export function connectingSlugToProvider(slug: string | null): Provider | null {
  if (!slug) return null;
  const key = slug.trim().toLowerCase() as OAuthConnectingSlug;
  return SLUG_TO_PROVIDER[key] ?? null;
}

export function oauthConnectingProviderLabelKey(slug: OAuthConnectingSlug): string {
  return `auth.connecting.provider.${slug}`;
}

export function buildOAuthConnectingHref(provider: Provider, next?: string): string {
  const slug = providerToConnectingSlug(provider);
  if (!slug) return "/login";
  const params = new URLSearchParams({ provider: slug });
  const safe = safeNext(next);
  if (safe !== "/") params.set("next", safe);
  return `/auth/connecting?${params.toString()}`;
}
