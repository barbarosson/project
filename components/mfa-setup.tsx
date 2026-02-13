'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ShieldCheck, ShieldOff, QrCode, Copy, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface MfaSetupProps {
  language: 'tr' | 'en'
}

const t = {
  tr: {
    title: 'Iki Faktorlu Dogrulama (2FA)',
    description: 'Hesabinizi ekstra bir guvenlik katmaniyla koruyun',
    enabled: 'Aktif',
    disabled: 'Pasif',
    enable2fa: '2FA Etkinlestir',
    disable2fa: '2FA Devre Disi Birak',
    step1Title: 'Adim 1: QR Kodu Tarayin',
    step1Desc: 'Google Authenticator, Authy veya benzer bir uygulama ile asagidaki QR kodu tarayin.',
    step2Title: 'Adim 2: Kodu Dogrulayin',
    step2Desc: 'Uygulamanizda gordugunuz 6 haneli kodu girin.',
    manualEntry: 'Manuel giris kodu:',
    copied: 'Kopyalandi!',
    verify: 'Dogrula ve Etkinlestir',
    verifying: 'Dogrulaniyor...',
    cancel: 'Iptal',
    setupSuccess: '2FA basariyla etkinlestirildi!',
    setupError: 'Kurulum sirasinda hata olustu',
    disableConfirmTitle: '2FA Devre Disi Birak',
    disableConfirmDesc: '2 faktorlu dogrulamayi devre disi birakmak hesabinizin guvenligini azaltacaktir. Devam etmek istiyor musunuz?',
    disableSuccess: '2FA devre disi birakildi',
    disableError: 'Devre disi birakma hatasi',
    confirm: 'Evet, Devre Disi Birak',
    securityNote: 'Guvenlik notu: 2FA etkinlestirdikten sonra her giriste dogrulama uygulamanizdan bir kod girmeniz gerekecektir.',
    invalidCode: 'Gecersiz kod. Tekrar deneyin.',
    loading: 'Yukleniyor...',
  },
  en: {
    title: 'Two-Factor Authentication (2FA)',
    description: 'Protect your account with an extra layer of security',
    enabled: 'Enabled',
    disabled: 'Disabled',
    enable2fa: 'Enable 2FA',
    disable2fa: 'Disable 2FA',
    step1Title: 'Step 1: Scan QR Code',
    step1Desc: 'Scan the QR code below with Google Authenticator, Authy, or a similar app.',
    step2Title: 'Step 2: Verify Code',
    step2Desc: 'Enter the 6-digit code shown in your authenticator app.',
    manualEntry: 'Manual entry code:',
    copied: 'Copied!',
    verify: 'Verify & Enable',
    verifying: 'Verifying...',
    cancel: 'Cancel',
    setupSuccess: '2FA enabled successfully!',
    setupError: 'Error during setup',
    disableConfirmTitle: 'Disable 2FA',
    disableConfirmDesc: 'Disabling two-factor authentication will reduce the security of your account. Do you want to continue?',
    disableSuccess: '2FA has been disabled',
    disableError: 'Error disabling 2FA',
    confirm: 'Yes, Disable',
    securityNote: 'Security note: After enabling 2FA, you will need to enter a code from your authenticator app every time you sign in.',
    invalidCode: 'Invalid code. Please try again.',
    loading: 'Loading...',
  },
}

export function MfaSetup({ language }: MfaSetupProps) {
  const l = t[language]
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showDisableDialog, setShowDisableDialog] = useState(false)

  useEffect(() => {
    checkMfaStatus()
  }, [])

  async function checkMfaStatus() {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error
      const verifiedFactor = data.totp.find((f) => f.status === 'verified')
      if (verifiedFactor) {
        setMfaEnabled(true)
        setFactorId(verifiedFactor.id)
      }
    } catch {
      // silent
    } finally {
      setInitialLoading(false)
    }
  }

  async function handleStartEnroll() {
    setEnrolling(true)
    setCode('')
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Modulus Authenticator',
      })
      if (error) throw error

      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setFactorId(data.id)
    } catch (error: any) {
      toast.error(error.message || l.setupError)
      setEnrolling(false)
    }
  }

  async function handleVerifyEnroll() {
    if (code.length !== 6 || !factorId) return

    setLoading(true)
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      })

      if (verifyError) {
        toast.error(l.invalidCode)
        setCode('')
        return
      }

      toast.success(l.setupSuccess)
      setMfaEnabled(true)
      setEnrolling(false)
      setQrCode(null)
      setSecret(null)
    } catch (error: any) {
      toast.error(error.message || l.setupError)
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable() {
    if (!factorId) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) throw error

      toast.success(l.disableSuccess)
      setMfaEnabled(false)
      setFactorId(null)
      setShowDisableDialog(false)
    } catch (error: any) {
      toast.error(error.message || l.disableError)
    } finally {
      setLoading(false)
    }
  }

  function handleCopySecret() {
    if (secret) {
      navigator.clipboard.writeText(secret)
      toast.success(l.copied)
    }
  }

  function handleCancelEnroll() {
    if (factorId && !mfaEnabled) {
      supabase.auth.mfa.unenroll({ factorId }).catch(() => {})
    }
    setEnrolling(false)
    setQrCode(null)
    setSecret(null)
    setCode('')
    setFactorId(null)
  }

  if (initialLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">{l.loading}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                {l.title}
              </CardTitle>
              <CardDescription>{l.description}</CardDescription>
            </div>
            <Badge variant={mfaEnabled ? 'default' : 'secondary'} className={mfaEnabled ? 'bg-emerald-500' : ''}>
              {mfaEnabled ? l.enabled : l.disabled}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!enrolling && !mfaEnabled && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">{l.securityNote}</p>
                </div>
              </div>
              <Button
                onClick={handleStartEnroll}
                className="bg-[#2ECC71] hover:bg-[#27AE60]"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                {l.enable2fa}
              </Button>
            </div>
          )}

          {enrolling && qrCode && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  {l.step1Title}
                </h3>
                <p className="text-sm text-gray-600">{l.step1Desc}</p>
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
                {secret && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500">{l.manualEntry}</span>
                    <code className="text-xs font-mono bg-white px-2 py-1 rounded border flex-1 select-all">
                      {secret}
                    </code>
                    <Button variant="ghost" size="sm" onClick={handleCopySecret}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {l.step2Title}
                </h3>
                <p className="text-sm text-gray-600">{l.step2Desc}</p>
                <div className="flex justify-center">
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
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelEnroll}
                  disabled={loading}
                  className="flex-1"
                >
                  {l.cancel}
                </Button>
                <Button
                  className="flex-1 bg-[#2ECC71] hover:bg-[#27AE60]"
                  onClick={handleVerifyEnroll}
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
              </div>
            </div>
          )}

          {mfaEnabled && !enrolling && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-800">
                    {language === 'tr'
                      ? '2 faktorlu dogrulama aktif. Hesabiniz ek bir guvenlik katmaniyla korunuyor.'
                      : 'Two-factor authentication is active. Your account is protected with an extra layer of security.'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDisableDialog(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                {l.disable2fa}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{l.disableConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{l.disableConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{language === 'tr' ? 'Iptal' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {l.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
