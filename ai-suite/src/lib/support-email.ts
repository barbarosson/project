/** Public support / contact address (mailto on /contact and env fallback). */
export const DEFAULT_SUPPORT_EMAIL = "info@modulustech.app";

export function getPublicSupportEmail(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  return fromEnv || DEFAULT_SUPPORT_EMAIL;
}
