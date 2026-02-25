'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ParasutHeroSection } from './parasut-hero-section'
import { ParasutFeaturesSection } from './parasut-features-section'
import { ThreeStepOnboardingSection } from './three-step-onboarding-section'
import { NumbersThatMatterSection } from './numbers-that-matter-section'
import { ParasutPricingSection } from './parasut-pricing-section'
import { ParasutFooter } from './parasut-footer'
import { MarketingHeader } from './marketing-header'
import { LoadingSpinner } from '@/components/loading-spinner'
import { BannerDisplay } from '@/components/banner-display'

export function ParasutLandingLayout() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(!!user)
  }, [user])

  // Giriş yapmış kullanıcı ana sayfadaysa dashboard'a yönlendir (dashboard'ın açılmasını sağla)
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard')
    }
  }, [authLoading, user, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />
      <BannerDisplay position="top" pageSlug="landing" />

      <main>
        <BannerDisplay position="hero" pageSlug="landing" />
        <ParasutHeroSection isAuthenticated={isAuthenticated} />
        <BannerDisplay position="middle" pageSlug="landing" />
        <ParasutFeaturesSection />
        <NumbersThatMatterSection />
        <ThreeStepOnboardingSection />
        <ParasutPricingSection />
        <BannerDisplay position="bottom" pageSlug="landing" />
      </main>

      <ParasutFooter />
      <BannerDisplay position="popup" pageSlug="landing" />
    </div>
  )
}
