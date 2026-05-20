const PRODUCTION_ISENDAI_URL = 'https://isendai.com'
const LOCAL_ISENDAI_DEV_URL = 'http://localhost:3001'

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, '')
}

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

/**
 * URL for the isendAI web app (tools, pricing, etc.).
 * When Modulus runs on localhost, app links default to ai-suite on port 3001.
 */
export function getIsendaiAppUrl(): string {
  if (typeof window !== 'undefined' && isLocalHostname(window.location.hostname)) {
    return LOCAL_ISENDAI_DEV_URL
  }

  const fromEnv = process.env.NEXT_PUBLIC_ISENDAI_URL?.trim()
  if (fromEnv) return normalizeUrl(fromEnv)

  if (process.env.NODE_ENV === 'development') {
    return LOCAL_ISENDAI_DEV_URL
  }

  return PRODUCTION_ISENDAI_URL
}

export function isLocalIsendaiAppUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return isLocalHostname(hostname)
  } catch {
    return false
  }
}

/** Same-tab navigation for local dev; new tab for production. */
export function isendaiAppLinkProps(url: string): {
  target?: '_blank'
  rel?: 'noopener noreferrer'
} {
  if (isLocalIsendaiAppUrl(url)) return {}
  return { target: '_blank', rel: 'noopener noreferrer' }
}
