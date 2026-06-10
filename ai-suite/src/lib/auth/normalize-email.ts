/** Trim, lowercase, and strip invisible chars before Supabase Auth calls. */
export function normalizeEmailForAuth(raw: string): string {
  return raw
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

/** Practical client-side check; Supabase Auth validates again server-side. */
export function isPlausibleAuthEmail(value: string): boolean {
  const email = normalizeEmailForAuth(value);
  if (!email || email.length > 254) return false;
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local || !domain.includes(".")) return false;
  if (/\s/.test(email)) return false;
  return true;
}
