'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ModulusLogoSvgOnly } from '@/components/modulus-logo'

interface MfaVerifyProps {
  onVerified: () => void
  onCancel: () => void
  language: 'tr' | 'en'
  embedded?: boolean
}

const t = {
  tr: {
    title: '2 Faktorlu Dogrulama',
    subtitle: 'Dogrulama uygulamanizdan 6 haneli kodu girin',
    enterCode: 'Dogrulama Kodu',
    verify: 'Dogrula',
    verifying: 'Dogrulaniyor...',
    cancel: 'Geri Don',
    invalidCode: 'Gecersiz dogrulama kodu. Tekrar deneyin.',
    error: 'Dogrulama hatasi olustu',
    codeRequired: 'Lutfen 6 haneli kodu girin',
  },
  en: {
    title: 'Two-Factor Authentication',
    subtitle: 'Enter the 6-digit code from your authenticator app',
    enterCode: 'Verification Code',
    verify: 'Verify',
    verifying: 'Verifying...',
    cancel: 'Go Back',
    invalidCode: 'Invalid verification code. Please try again.',
    error: 'Verification error occurred',
    codeRequired: 'Please enter the 6-digit code',
  },
}

export function MfaVerify({ onVerified, onCancel, language, embedded = false }: MfaVerifyProps) {
  const l = t[language]
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [factorId, setFactorId] = useState<string | null>(null)

  useEffect(() => {
    loadFactors()
  }, [])

  async function loadFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) return
    const totpFactor = data.totp.find((f) => f.status === 'verified')
    if (totpFactor) {
      setFactorId(totpFactor.id)
    }
  }

  const handleVerify = useCallback(async (otpCode: string) => {
    if (otpCode.length !== 6 || !factorId) return

    setLoading(true)
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: otpCode,
      })

      if (verifyError) {
        toast.error(l.invalidCode)
        setCode('')
        return
      }

      onVerified()
    } catch (error: any) {
      toast.error(error.message || l.error)
      setCode('')
    } finally {
      setLoading(false)
    }
  }, [factorId, l.invalidCode, l.error, onVerified])

  useEffect(() => {
    if (code.length === 6) {
      handleVerify(code)
    }
  }, [code, handleVerify])

  const content = (
    <div className="w-full max-w-md space-y-6">
      {!embedded && (
        <div className="text-center space-y-2">
          <div className="mb-6 flex justify-center">
            <ModulusLogoSvgOnly size={96} />
          </div>
        </div>
      )}
      <Card className={embedded ? 'border-0 shadow-none bg-transparent' : 'border-2'}>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={embedded ? { background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' } : { backgroundColor: 'rgb(209, 250, 229)' }}>
              <ShieldCheck className="h-8 w-8" style={embedded ? { color: '#7DD3FC' } : { color: 'rgb(5, 150, 105)' }} />
            </div>
            <CardTitle className="text-xl">{l.title}</CardTitle>
            <CardDescription>{l.subtitle}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <label className="text-sm font-medium text-gray-700">{l.enterCode}</label>
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                disabled={loading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <span className="text-gray-400 mx-1">-</span>
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              className="w-full rounded-full font-semibold"
              style={embedded ? { backgroundColor: '#0A2540', color: '#ffffff' } : { backgroundColor: '#00D4AA' }}
              onClick={() => handleVerify(code)}
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {l.verifying}
                </div>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {l.verify}
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={onCancel}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {l.cancel}
            </Button>
          </CardContent>
        </Card>
      </div>
  )

  if (embedded) {
    return content
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {content}
    </div>
  )
}
