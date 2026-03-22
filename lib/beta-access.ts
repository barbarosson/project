/** Beta önizleme kapısı — middleware + istemci senkronu */

export const BETA_COOKIE_NAME = 'modulus_beta_access'
export const BETA_SESSION_STORAGE_KEY = 'modulus_beta_home_unlock_v1'

/** Sunucuda `BETA_ACCESS_CODE` ile override edilebilir */
export const DEFAULT_BETA_ACCESS_CODE = 'QWERTY123'

export const REFERENCE_CODE_DISPLAY = 'MOD-BETA-2026'

export function getBetaAccessCode(): string {
  return process.env.BETA_ACCESS_CODE?.trim() || DEFAULT_BETA_ACCESS_CODE
}

/** Sadece uygulama içi yönlendirme (open redirect önleme) */
export function safeReturnPath(returnTo: string | null): string | null {
  if (!returnTo || typeof returnTo !== 'string') return null
  const t = returnTo.trim()
  if (!t.startsWith('/') || t.startsWith('//')) return null
  return t
}
