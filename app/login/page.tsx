'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Globe, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/loading-spinner'
import { ModulusLogoSvgOnly } from '@/components/modulus-logo'
import { MfaVerify } from '@/components/mfa-verify'

const t = {
  tr: {
    welcome: 'Tekrar Hos Geldiniz',
    subtitle: 'Hesabiniza giris yaparak buyumeye devam edin',
    signIn: 'Giris Yap',
    signUp: 'Kayit Ol',
    signInDesc: 'Hesabiniza giris yapin',
    signUpDesc: 'Yeni hesap olusturun',
    email: 'E-posta',
    password: 'Sifre',
    confirmPassword: 'Sifre Tekrar',
    fullName: 'Ad Soyad',
    magicLink: 'Sihirli Link',
    magicLinkDesc: 'E-postaniza giris linki gonderecegiz. Sifre gerekmez!',
    sendMagicLink: 'Sihirli Link Gonder',
    sending: 'Gonderiliyor...',
    or: 'veya',
    googleContinue: 'Google ile devam et',
    fillAll: 'Lutfen tum alanlari doldurun',
    passwordMin: 'Sifre en az 6 karakter olmali',
    passwordMismatch: 'Sifreler eslesmiyor',
    loginSuccess: 'Giris basarili!',
    invalidCredentials: 'E-posta veya sifre hatali. Lutfen tekrar deneyin.',
    emailNotConfirmed: 'E-postanizi henuz dogrulamadiniz. Lutfen gelen kutunuzu kontrol edin.',
    genericError: 'Bir hata olustu',
    processing: 'Isleniyor...',
    checkEmail: 'E-postanizi Kontrol Edin!',
    confirmationSent: 'adresine bir dogrulama linki gonderdik. Lutfen gelen kutunuzu kontrol edin ve linke tiklayarak hesabinizi aktif hale getirin.',
    checkSpam: 'E-posta gelmediyse spam/gereksiz klasorunu kontrol edin.',
    resendEmail: 'Tekrar Gonder',
    resending: 'Gonderiliyor...',
    resendSuccess: 'Dogrulama e-postasi tekrar gonderildi!',
    backToLogin: 'Girise Don',
    signUpSuccess: 'Kayit basarili! E-postanizi kontrol edin.',
    magicLinkSent: 'E-postanizi kontrol edin! Giris linki gonderildi.',
    demoRequestInfo: 'Henuz hesabiniz yok mu? Demo talebi gonderin, onaylandiginda ornek verilerle dolu bir hesap olusturalim!',
    demoRequestBtn: 'Demo Hesap Talebi Gonder',
    tryDemo: 'Hazir Demo Hesabini Dene',
    demoSuccess: 'Demo hesabina giris yapildi!',
    demoFail: 'Demo hesabina giris yapilamadi. Lutfen yoneticiyle iletisime gecin.',
    backHome: 'Ana Sayfaya Don',
    googleNotEnabled: 'Google girisi henuz etkinlestirilmemis',
    loading: 'Yukleniyor...',
    userExists: 'Bu e-posta adresi zaten kayitli. Lutfen giris yapin.',
  },
  en: {
    welcome: 'Welcome Back',
    subtitle: 'Sign in to continue your growth',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signInDesc: 'Sign in to your account',
    signUpDesc: 'Create a new account',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    magicLink: 'Magic Link',
    magicLinkDesc: "We'll send a login link to your email. No password needed!",
    sendMagicLink: 'Send Magic Link',
    sending: 'Sending...',
    or: 'or',
    googleContinue: 'Continue with Google',
    fillAll: 'Please fill in all fields',
    passwordMin: 'Password must be at least 6 characters',
    passwordMismatch: 'Passwords do not match',
    loginSuccess: 'Login successful!',
    invalidCredentials: 'Invalid email or password. Please try again.',
    emailNotConfirmed: 'Email not confirmed yet. Please check your inbox.',
    genericError: 'An error occurred',
    processing: 'Processing...',
    checkEmail: 'Check Your Email!',
    confirmationSent: 'We sent a verification link to . Please check your inbox and click the link to activate your account.',
    checkSpam: "If you don't see the email, check your spam/junk folder.",
    resendEmail: 'Resend Email',
    resending: 'Sending...',
    resendSuccess: 'Verification email resent!',
    backToLogin: 'Back to Login',
    signUpSuccess: 'Registration successful! Check your email.',
    magicLinkSent: 'Check your email! Magic link sent.',
    demoRequestInfo: "Don't have an account? Request a demo and we'll create an account with sample data for you!",
    demoRequestBtn: 'Request Demo Account',
    tryDemo: 'Try Ready Demo Account',
    demoSuccess: 'Signed in to demo account!',
    demoFail: 'Could not sign in to demo account. Please contact administrator.',
    backHome: 'Back to Homepage',
    googleNotEnabled: 'Google sign-in is not enabled yet',
    loading: 'Loading...',
    userExists: 'This email is already registered. Please sign in.',
  },
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { language, setLanguage } = useLanguage()
  const l = t[language]

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')
  const [authMethod, setAuthMethod] = useState<'email' | 'magic'>('email')
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showMfaVerify, setShowMfaVerify] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      const decodedError = decodeURIComponent(errorParam)
      toast.error(`${l.signIn} failed: ${decodedError}`, { duration: 6000 })
    }
    const confirmed = searchParams.get('confirmed')
    if (confirmed === 'true') {
      toast.success(language === 'tr'
        ? 'E-posta dogrulandi! Artik giris yapabilirsiniz.'
        : 'Email confirmed! You can now sign in.')
    }
  }, [searchParams, language, l.signIn])

  useEffect(() => {
    if (!authLoading && user) {
      checkAndCreateTenant()
    }
  }, [user, authLoading])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  async function checkAndCreateTenant() {
    if (!user) return
    try {
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!existingTenant && user.user_metadata?.full_name) {
        await createTenantForUser(user.id, user.user_metadata.full_name, user.email || '')
      }
      router.push('/dashboard')
    } catch (error) {
      router.push('/dashboard')
    }
  }

  async function handleEmailSignIn() {
    if (!email || !password) {
      toast.error(l.fillAll)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel === 'aal1') {
        setShowMfaVerify(true)
        return
      }

      toast.success(l.loginSuccess)
      router.push('/dashboard')
    } catch (error: any) {
      let msg = error.message || l.genericError
      if (error.message?.includes('Invalid login credentials')) {
        msg = l.invalidCredentials
      } else if (error.message?.includes('Email not confirmed')) {
        msg = l.emailNotConfirmed
      }
      toast.error(msg, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp() {
    if (!email || !password || !fullName) {
      toast.error(l.fillAll)
      return
    }
    if (password.length < 6) {
      toast.error(l.passwordMin)
      return
    }
    if (password !== confirmPw) {
      toast.error(l.passwordMismatch)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data.user && !data.session) {
        setRegisteredEmail(email)
        setShowConfirmation(true)
        setResendCooldown(60)
        sendWelcomeEmail(email, fullName)
      } else if (data.session) {
        toast.success(l.loginSuccess)
        router.push('/dashboard')
      }
    } catch (error: any) {
      let msg = error.message || l.genericError
      if (error.message?.includes('already registered') || error.message?.includes('already been registered')) {
        msg = l.userExists
      }
      toast.error(msg, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  async function sendWelcomeEmail(toEmail: string, name: string) {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-welcome-email`
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: toEmail, fullName: name, language }),
      })
    } catch (err) {
      // non-critical
    }
  }

  async function handleResendConfirmation() {
    if (resendCooldown > 0) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
      toast.success(l.resendSuccess)
      setResendCooldown(60)
    } catch (error: any) {
      toast.error(error.message || l.genericError)
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink() {
    if (!email) {
      toast.error(l.fillAll)
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
      toast.success(l.magicLinkSent)
    } catch (error: any) {
      toast.error(error.message || l.genericError)
    } finally {
      setLoading(false)
    }
  }

  async function handleSocialAuth(provider: 'google') {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) throw error
      if (!data.url) throw new Error('OAuth initialization failed')
    } catch (error: any) {
      let msg = l.genericError
      if (error.message?.includes('not enabled')) msg = l.googleNotEnabled
      else if (error.message) msg = error.message
      toast.error(msg, { duration: 5000 })
      setLoading(false)
    }
  }

  async function createTenantForUser(userId: string, name: string, userEmail: string) {
    try {
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle()

      if (!existing) {
        const companyName = name.split(' ')[0] + "'s Business"
        const { data: newTenant, error } = await supabase
          .from('tenants')
          .insert({
            name: companyName,
            owner_id: userId,
            settings: {
              currency: language === 'tr' ? 'TRY' : 'USD',
              language,
              plan: 'demo',
              plan_started_at: new Date().toISOString(),
              trial_ends_at: null,
            },
          })
          .select()
          .single()

        if (error) throw error

        await supabase.from('company_settings').insert({
          tenant_id: newTenant.id,
          company_name: companyName,
          email: userEmail,
          currency: language === 'tr' ? 'TRY' : 'USD',
          language,
        })
      }
    } catch (error) {
      console.error('Error creating tenant:', error)
    }
  }

  async function handleDemoLogin() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@modulus.com',
        password: 'demo123456',
      })
      if (error) throw error

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel === 'aal1') {
        setShowMfaVerify(true)
        return
      }

      toast.success(l.demoSuccess)
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(l.demoFail, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text={l.loading} />
      </div>
    )
  }

  if (showMfaVerify) {
    return (
      <MfaVerify
        language={language}
        onVerified={() => {
          toast.success(l.loginSuccess)
          router.push('/dashboard')
        }}
        onCancel={async () => {
          await supabase.auth.signOut()
          setShowMfaVerify(false)
        }}
      />
    )
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-2" style={{ borderColor: '#00D4AA' }}>
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00D4AA20' }}>
                <MailCheck className="h-10 w-10" style={{ color: '#00D4AA' }} />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold" style={{ color: '#0A2540' }}>{l.checkEmail}</h2>
                <p style={{ color: '#425466' }}>
                  <span className="font-semibold" style={{ color: '#00D4AA' }}>{registeredEmail}</span>
                  {' '}
                  {language === 'tr'
                    ? 'adresine bir dogrulama linki gonderdik. Lutfen gelen kutunuzu kontrol edin ve linke tiklayarak hesabinizi aktif hale getirin.'
                    : 'We sent a verification link. Please check your inbox and click the link to activate your account.'}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">{l.checkSpam}</p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResendConfirmation}
                  disabled={loading || resendCooldown > 0}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {loading
                    ? l.resending
                    : resendCooldown > 0
                      ? `${l.resendEmail} (${resendCooldown}s)`
                      : l.resendEmail}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowConfirmation(false)
                    setActiveTab('signin')
                  }}
                >
                  {l.backToLogin}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mb-6 flex justify-center">
            <ModulusLogoSvgOnly size={96} />
          </div>
          <h2 className="text-3xl font-bold" style={{ color: '#0A2540' }}>{l.welcome}</h2>
          <p style={{ color: '#425466' }}>{l.subtitle}</p>
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            {language === 'tr' ? 'English' : 'Turkce'}
          </Button>
        </div>

        <Card className="border-2">
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{l.signIn}</TabsTrigger>
                <TabsTrigger value="signup">{l.signUp}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialAuth('google')}
                disabled={loading}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {l.googleContinue}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">{l.or}</span>
              </div>
            </div>

            {activeTab === 'signin' ? (
              <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'email' | 'magic')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email" className="data-[state=inactive]:text-[#0A192F]">
                    {l.email}
                  </TabsTrigger>
                  <TabsTrigger value="magic" className="data-[state=inactive]:text-[#0A192F]">
                    {l.magicLink}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{l.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                        onKeyDown={(e) => e.key === 'Enter' && handleEmailSignIn()}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">{l.password}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                        onKeyDown={(e) => e.key === 'Enter' && handleEmailSignIn()}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full text-white"
                    style={{ background: 'linear-gradient(135deg, #0A2540 0%, #0D3158 100%)' }}
                    onClick={handleEmailSignIn}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {l.processing}
                      </div>
                    ) : (
                      <>
                        {l.signIn}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="magic" className="space-y-4 mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Sparkles className="h-5 w-5" />
                      <span className="font-medium">{l.magicLink}</span>
                    </div>
                    <p className="text-sm text-blue-600">{l.magicLinkDesc}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="magic-email">{l.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                        onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full text-white"
                    style={{ background: 'linear-gradient(135deg, #0A2540 0%, #0D3158 100%)' }}
                    onClick={handleMagicLink}
                    disabled={loading}
                  >
                    {loading ? l.sending : l.sendMagicLink}
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{l.fullName}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder={language === 'tr' ? 'Adiniz Soyadiniz' : 'Your Full Name'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{l.email}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{l.password}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">{l.confirmPassword}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="********"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                    />
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-emerald-700">
                      {language === 'tr'
                        ? 'Kayit olduktan sonra e-posta adresinize bir dogrulama linki gonderilecektir. Hesabiniz bu link ile aktif olacaktir.'
                        : 'After registration, a verification link will be sent to your email. Your account will be activated through this link.'}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full text-white"
                  style={{ background: 'linear-gradient(135deg, #0A2540 0%, #0D3158 100%)' }}
                  onClick={handleSignUp}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {l.processing}
                    </div>
                  ) : (
                    <>
                      {l.signUp}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <div className="rounded-lg p-4 mb-4" style={{ background: 'linear-gradient(135deg, #F6F9FC 0%, #E6EBF1 100%)' }}>
            <p className="text-sm mb-3" style={{ color: '#425466' }}>{l.demoRequestInfo}</p>
            <Button
              className="w-full text-white"
              style={{ background: 'linear-gradient(135deg, #0A2540 0%, #0D3158 100%)' }}
              onClick={() => router.push('/landing#demo-request')}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {l.demoRequestBtn}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full"
              style={{ borderColor: '#0A2540', color: '#0A2540' }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {l.tryDemo}
            </Button>
            <Button
              variant="link"
              onClick={() => router.push('/landing')}
              className="text-gray-600"
            >
              {language === 'tr' ? `← ${l.backHome}` : `← ${l.backHome}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
