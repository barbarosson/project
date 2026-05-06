/** Normalized slug for RAG routing (destinasyon eşlemesi). */
export function destinationSlug(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return s.length ? s : "unknown";
}
