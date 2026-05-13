/** HttpOnly cookie storing anonymous owner id (billing / history before sign-in). */
export const ANON_COOKIE = "isendai_anon_id";

/**
 * Middleware sets this on every request so Server Components can resolve the same anon id
 * as the cookie that will be sent on the response (RSC cannot read Set-Cookie from the same round-trip).
 */
export const ANON_ID_REQUEST_HEADER = "x-isendai-anon-id";

export const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
