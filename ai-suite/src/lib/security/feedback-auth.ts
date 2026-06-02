/** Production defaults to signed-in feedback unless explicitly opened to anon. */
export function feedbackRequiresAuth(): boolean {
  const raw = process.env.ISENDAI_FEEDBACK_REQUIRE_AUTH?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "no") return false;
  if (raw === "1" || raw === "true" || raw === "yes") return true;
  return process.env.NODE_ENV === "production";
}
