'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { ParasutFooter } from '@/components/marketing/parasut-footer';

const adminT = {
  tr: {
    title: 'Admin Portal',
    subtitle: 'Yönetici kimlik bilgilerinizle giriş yapın',
    email: 'E-posta',
    emailPlaceholder: 'admin@ornek.com',
    password: 'Şifre',
    passwordPlaceholder: 'Şifrenizi girin',
    signIn: 'Giriş Yap',
    signingIn: 'Giriş yapılıyor...',
    help: 'Yardım mı lazım? Sistem yöneticinizle iletişime geçin',
    note: 'Not: Hesabınızın profiles tablosunda admin rolü olmalıdır',
    backToHome: 'Ana Sayfaya Dön',
  },
  en: {
    title: 'Admin Portal',
    subtitle: 'Sign in with your administrator credentials',
    email: 'Email',
    emailPlaceholder: 'admin@example.com',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    help: 'Need help? Contact your system administrator',
    note: 'Note: Your user account must have admin role in the profiles table',
    backToHome: 'Back to Home',
  },
};

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const t = adminT[language as keyof typeof adminT] || adminT.en;
  const { login, session, user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/admin/site-commander';

  useEffect(() => {
    const checkAuth = async () => {
      if (hasCheckedAuth) return;
      if (authLoading) return;
      if (!user || !session) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && (profile.role === 'admin' || profile.role === 'super_admin')) {
        setHasCheckedAuth(true);
        window.location.href = redirectUrl;
      } else if (profileError) {
        setHasCheckedAuth(true);
      } else {
        setHasCheckedAuth(true);
      }
    };

    checkAuth();
  }, [user, session, authLoading, hasCheckedAuth, redirectUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    try {
      const sessionRes = await login(email, password);

      if (sessionRes) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionRes.user.id)
          .maybeSingle();

        if (profileError) {
          throw new Error(`Database error: ${profileError.message}`);
        }

        if (!profile) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: sessionRes.user.id,
              email: sessionRes.user.email,
              role: sessionRes.user.email === 'admin@modulus.com' || sessionRes.user.email === 'erp.songur@gmail.com' ? 'super_admin' : 'user',
              full_name: sessionRes.user.email === 'admin@modulus.com' ? 'System Administrator' : 'User'
            })
            .select()
            .single();

          if (createError) {
            throw new Error('Profile not found and could not be created. Please contact administrator.');
          }

          if (newProfile.role !== 'admin' && newProfile.role !== 'super_admin') {
            await supabase.auth.signOut();
            throw new Error('Access denied. Admin privileges required.');
          }

          await new Promise(resolve => setTimeout(resolve, 100));
          window.location.href = redirectUrl;
          return;
        }

        if (profile.role !== 'admin' && profile.role !== 'super_admin') {
          await supabase.auth.signOut();
          throw new Error('Access denied. Admin privileges required.');
        }

        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.href = redirectUrl;
      }
    } catch (err: any) {
      if (err.message?.includes('Profile not found')) {
        await supabase.auth.signOut();
        localStorage.clear();
        setLocalError(language === 'tr' ? 'Oturum temizlendi. Lütfen tekrar giriş yapın.' : 'Session cleared. Please try logging in again.');
      } else {
        setLocalError(err.message || (language === 'tr' ? 'Giriş başarısız. Lütfen tekrar deneyin.' : 'Login failed. Please try again.'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6"
        style={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <Link href="/landing">
          <Button variant="ghost" size="sm" className="gap-2 font-medium" style={{ color: '#0A2540' }}>
            <ArrowLeft className="h-4 w-4" />
            {t.backToHome}
          </Button>
        </Link>
      </header>

      <main>
        <section className="stripe-hero-gradient relative min-h-screen flex items-center justify-center pt-16" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black select-none"
              style={{
                fontSize: 'clamp(140px, 22vw, 320px)',
                color: 'rgba(255,255,255,0.06)',
                letterSpacing: '-0.04em',
                lineHeight: 0.9,
                fontFamily: 'var(--font-inter), system-ui, sans-serif',
              }}
            >
              MODULUS
            </div>
            <div className="absolute top-20 right-[10%] w-[500px] h-[500px] rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.3) 0%, transparent 70%)' }} />
            <div className="absolute bottom-10 left-[5%] w-[400px] h-[400px] rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, rgba(0,115,230,0.3) 0%, transparent 70%)' }} />
          </div>

          <div className="relative z-10 w-full max-w-md mx-auto px-4">
            <div
              className="rounded-2xl p-8 shadow-2xl animate-fade-in overflow-hidden"
              style={{
                backgroundColor: 'rgba(255,255,255,0.98)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div className="text-center mb-8">
                <div
                  className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}
                >
                  <Shield className="h-8 w-8 text-[#7DD3FC]" stroke="#7DD3FC" />
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: '#0A2540' }}>
                  {t.title}
                </h1>
                <p className="text-sm" style={{ color: '#425466' }}>
                  {t.subtitle}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {localError && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription>{localError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium" style={{ color: '#0A2540' }}>
                    {t.email}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={authLoading}
                    autoComplete="email"
                    className="rounded-xl h-12"
                    style={{ borderColor: '#E6EBF1', backgroundColor: '#fff' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-medium" style={{ color: '#0A2540' }}>
                    {t.password}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={authLoading}
                    autoComplete="current-password"
                    className="rounded-xl h-12"
                    style={{ borderColor: '#E6EBF1', backgroundColor: '#fff' }}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full h-12 font-semibold text-base gap-2 transition-all duration-300 hover:scale-[1.02]"
                  style={{ backgroundColor: '#0A2540', color: '#ffffff' }}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t.signingIn}
                    </>
                  ) : (
                    <>
                      {t.signIn}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 space-y-4" style={{ borderTop: '1px solid #E6EBF1' }}>
                <p className="text-sm text-center" style={{ color: '#425466' }}>
                  {t.help}
                </p>
                <p className="text-xs text-center" style={{ color: '#425466' }}>
                  {t.note}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ParasutFooter />
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#0A2540] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#425466] font-medium">Yükleniyor...</p>
        </div>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
