'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Session, AuthenticatorAssuranceLevels } from '@supabase/supabase-js'
import { toast } from 'sonner'
import {
  getUserRole,
  isAdmin,
  isSuperAdmin,
  isDemo,
  isRegular,
  canAccessAdminRoutes,
  canAccessManagement,
  canModifyData,
  canDeleteData,
  canModifySettings,
  canAccessRoute,
  UserRole
} from '@/lib/access-control'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
  userRole: UserRole
  isAdmin: boolean
  isSuperAdmin: boolean
  isDemo: boolean
  isRegular: boolean
  canAccessAdminRoutes: boolean
  canAccessManagement: boolean
  canModifyData: boolean
  canDeleteData: boolean
  canModifySettings: boolean
  canAccessRoute: (pathname: string) => boolean
  mfaRequired: boolean
  mfaVerified: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEV_MODE_ENABLED = false

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaVerified, setMfaVerified] = useState(false)

  useEffect(() => {
    initializeAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        (async () => {
          setSession(newSession)
          setUser(newSession?.user ?? null)

          if (event === 'SIGNED_OUT') {
            setSession(null)
            setUser(null)
            setMfaRequired(false)
            setMfaVerified(false)
          }

          if (newSession?.user) {
            checkMfaStatus(newSession)
          }
        })()
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function checkMfaStatus(currentSession: Session | null) {
    if (!currentSession) {
      setMfaRequired(false)
      setMfaVerified(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (error) return

      const { currentLevel, nextLevel } = data as { currentLevel: AuthenticatorAssuranceLevels | null; nextLevel: AuthenticatorAssuranceLevels | null }
      if (nextLevel === 'aal2' && currentLevel === 'aal1') {
        setMfaRequired(true)
        setMfaVerified(false)
      } else if (currentLevel === 'aal2') {
        setMfaRequired(false)
        setMfaVerified(true)
      } else {
        setMfaRequired(false)
        setMfaVerified(false)
      }
    } catch {
      // silent
    }
  }

  async function initializeAuth() {
    try {
      const { data: { session: existingSession } } = await supabase.auth.getSession()

      if (existingSession?.user) {
        setSession(existingSession)
        setUser(existingSession.user)
        await checkMfaStatus(existingSession)
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)

      if (typeof window !== 'undefined') {
        const keysToRemove = Object.keys(localStorage).filter(
          k => k.startsWith('sb-') || k.startsWith('supabase')
        )
        keysToRemove.forEach(k => localStorage.removeItem(k))
        sessionStorage.clear()
        window.location.href = '/landing'
      }

      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  async function refreshAuth() {
    await initializeAuth()
  }

  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    signOut,
    refreshAuth,
    userRole: getUserRole(user),
    isAdmin: isAdmin(user),
    isSuperAdmin: isSuperAdmin(user),
    isDemo: isDemo(user),
    isRegular: isRegular(user),
    canAccessAdminRoutes: canAccessAdminRoutes(user),
    canAccessManagement: canAccessManagement(user),
    canModifyData: canModifyData(user),
    canDeleteData: canDeleteData(user),
    canModifySettings: canModifySettings(user),
    canAccessRoute: (pathname: string) => canAccessRoute(pathname, user),
    mfaRequired,
    mfaVerified,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
