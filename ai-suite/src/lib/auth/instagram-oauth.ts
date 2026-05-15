import type { Provider } from "@supabase/auth-js";

/**
 * Supabase Dashboard → Auth → Providers → Custom OAuth.
 * Identifier must match exactly (see README Instagram section).
 */
export const INSTAGRAM_OAUTH_PROVIDER = "custom:instagram" as Provider;

/** Minimal scope for Instagram API with Instagram Login (professional accounts). */
export const INSTAGRAM_OAUTH_SCOPES = "instagram_business_basic";
