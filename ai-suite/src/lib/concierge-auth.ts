/** Production defaults to signed-in concierge unless explicitly opened to anon. */
export function conciergeRequiresAuth(): boolean {
  const raw = process.env.ISENDAI_CONCIERGE_REQUIRE_AUTH?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "no") return false;
  if (raw === "1" || raw === "true" || raw === "yes") return true;
  return process.env.NODE_ENV === "production";
}
