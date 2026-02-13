'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/loading-spinner'
import { toast } from 'sonner'
import { CheckCircle2, XCircle } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    try {
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')
      const code = searchParams.get('code')
      const type = searchParams.get('type')

      if (error) {
        setStatus('error')
        setMessage(errorDescription || error)
        toast.error(errorDescription || error)
        setTimeout(() => router.push('/login'), 3000)
        return
      }

      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          setStatus('error')
          setMessage(exchangeError.message)
          toast.error('Authentication failed: ' + exchangeError.message)
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        if (data.session && data.user) {
          if (type === 'signup' || type === 'email') {
            setStatus('success')
            setMessage('Email confirmed successfully!')
            toast.success('Email confirmed!')
          }

          await ensureTenantExists(data.user)

          sendWelcomeEmailAfterConfirmation(data.user)

          setTimeout(() => router.push('/dashboard'), 1500)
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        await ensureTenantExists(session.user)
        toast.success('Successfully logged in!')
        router.push('/dashboard')
      } else {
        setStatus('error')
        setMessage('No session found')
        setTimeout(() => router.push('/login'), 3000)
      }
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || 'An unexpected error occurred')
      toast.error('Authentication failed')
      setTimeout(() => router.push('/login'), 3000)
    }
  }

  async function sendWelcomeEmailAfterConfirmation(user: any) {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-welcome-email`
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          language: 'tr',
          type: 'welcome',
        }),
      })
    } catch (err) {
      // non-critical
    }
  }

  async function ensureTenantExists(user: any) {
    try {
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (existingTenant) return existingTenant

      const fullName = user.user_metadata?.full_name ||
                       user.user_metadata?.name ||
                       user.email?.split('@')[0] ||
                       'User'
      const companyName = fullName.split(' ')[0] + "'s Business"
      const userEmail = user.email || ''

      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: companyName,
          owner_id: user.id,
          settings: {
            currency: 'TRY',
            language: 'tr',
            plan: 'demo',
            plan_started_at: new Date().toISOString(),
            trial_ends_at: null,
          },
        })
        .select()
        .single()

      if (tenantError) throw tenantError

      await supabase.from('company_settings').insert({
        tenant_id: newTenant.id,
        company_name: companyName,
        email: userEmail,
        currency: 'TRY',
      })

      return newTenant
    } catch (error) {
      console.error('Error ensuring tenant exists:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-4">
        {status === 'loading' && (
          <>
            <LoadingSpinner size="lg" />
            <div className="text-lg text-gray-600">Completing authentication...</div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="text-xl font-semibold text-emerald-700">Email Confirmed!</div>
            <div className="text-sm text-gray-500">Redirecting to dashboard...</div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-red-500 font-semibold">Authentication Failed</div>
            <div className="text-sm text-gray-600">{message}</div>
            <div className="text-sm text-gray-500">Redirecting to login...</div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
