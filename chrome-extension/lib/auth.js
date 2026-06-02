import { apiOrigin } from "./config.js";

/**
 * Returns true if isendai Supabase session cookies exist for the API origin.
 * Uses chrome.cookies (httpOnly cookies are readable with host permission).
 */
export async function hasIsendaiSession() {
  const origin = apiOrigin();
  const cookies = await chrome.cookies.getAll({ url: origin });
  return cookies.some(
    (c) =>
      c.name.includes("auth-token") ||
      (c.name.startsWith("sb-") && c.name.includes("auth"))
  );
}
