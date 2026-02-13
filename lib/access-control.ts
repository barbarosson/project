import { User } from '@supabase/supabase-js'

export const ADMIN_EMAIL = 'admin@modulus.com'
export const SUPER_ADMIN_EMAIL = 'admin@modulus.com'
export const DEMO_EMAIL = 'demo@modulus.com'

export type UserRole = 'super_admin' | 'admin' | 'demo' | 'regular'

export function isSuperAdmin(user: User | null): boolean {
  if (!user?.email) return false
  const email = user.email.toLowerCase().trim()
  return email === SUPER_ADMIN_EMAIL
}

export function getUserRole(user: User | null): UserRole {
  if (!user?.email) return 'regular'

  const email = user.email.toLowerCase().trim()

  if (email === SUPER_ADMIN_EMAIL) return 'super_admin'
  if (email === ADMIN_EMAIL) return 'admin'
  if (email === DEMO_EMAIL) return 'demo'

  return 'regular'
}

export function isAdmin(user: User | null): boolean {
  const role = getUserRole(user)
  return role === 'admin' || role === 'super_admin'
}

export function isDemo(user: User | null): boolean {
  return getUserRole(user) === 'demo'
}

export function isRegular(user: User | null): boolean {
  return getUserRole(user) === 'regular'
}

export function canAccessAdminRoutes(user: User | null): boolean {
  return isAdmin(user)
}

export function canAccessManagement(user: User | null): boolean {
  return isAdmin(user)
}

export function canModifyData(user: User | null): boolean {
  if (isSuperAdmin(user)) return true
  return !isDemo(user)
}

export function canDeleteData(user: User | null): boolean {
  if (isSuperAdmin(user)) return true
  return !isDemo(user)
}

export function canModifySettings(user: User | null): boolean {
  if (isSuperAdmin(user)) return true
  return !isDemo(user)
}

export const PROTECTED_ADMIN_ROUTES = [
  '/admin',
  '/admin/diagnostics',
  '/admin/helpdesk',
  '/admin/live-support',
]

export const PROTECTED_MANAGEMENT_ROUTES = [
  '/management',
  '/user-logs',
]

export function isProtectedRoute(pathname: string): boolean {
  return (
    PROTECTED_ADMIN_ROUTES.some(route => pathname.startsWith(route)) ||
    PROTECTED_MANAGEMENT_ROUTES.some(route => pathname.startsWith(route))
  )
}

export function canAccessRoute(pathname: string, user: User | null): boolean {
  if (PROTECTED_ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    return canAccessAdminRoutes(user)
  }

  if (PROTECTED_MANAGEMENT_ROUTES.some(route => pathname.startsWith(route))) {
    return canAccessManagement(user)
  }

  return true
}
