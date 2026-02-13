import type { SupportedStorage } from '@supabase/supabase-js'

export class CookieStorageAdapter implements SupportedStorage {
  private cookiePrefix = 'sb-auth-token'

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null

    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)

    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift()
      return cookieValue || null
    }

    return null
  }

  private setCookie(name: string, value: string, days: number = 7): void {
    if (typeof document === 'undefined') return

    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    const expires = `expires=${date.toUTCString()}`

    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`
  }

  private deleteCookie(name: string): void {
    if (typeof document === 'undefined') return

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  }

  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key)
        if (item) return item
      }
    } catch (e) {
      console.warn('[Storage] localStorage blocked, using cookie fallback')
    }

    return this.getCookie(`${this.cookiePrefix}-${key}`)
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value)
        console.log('[Storage] ✅ Saved to localStorage:', key)
      }
    } catch (e) {
      console.warn('[Storage] localStorage blocked, using cookie fallback')
    }

    this.setCookie(`${this.cookiePrefix}-${key}`, value, 7)
    console.log('[Storage] ✅ Saved to cookie:', key)
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key)
      }
    } catch (e) {
      console.warn('[Storage] localStorage access failed')
    }

    this.deleteCookie(`${this.cookiePrefix}-${key}`)
  }
}

export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const testKey = '__storage_test__'
    window.localStorage.setItem(testKey, 'test')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}
