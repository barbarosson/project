'use client'

import { HeroSection } from '@/components/marketing/hero-section'
import { FeaturesSection } from '@/components/marketing/features-section'
import { SocialProofSection } from '@/components/marketing/social-proof-section'
import { HowItWorksSection } from '@/components/marketing/how-it-works-section'
import { PricingSection } from '@/components/marketing/pricing-section'
import { CaseStudiesSection } from '@/components/marketing/case-studies-section'
import { FAQSection } from '@/components/marketing/faq-section'
import { FinalCTASection } from '@/components/marketing/final-cta-section'
import { MarketingLayout } from '@/components/marketing/marketing-layout'
import { BannerDisplay } from '@/components/banner-display'

export function LandingV2Client() {
  return (
    <MarketingLayout>
      <BannerDisplay position="top" pageSlug="home" />
      <BannerDisplay position="hero" pageSlug="home" />
      <HeroSection />
      <BannerDisplay position="middle" pageSlug="home" />
      <FeaturesSection />
      <SocialProofSection />
      <HowItWorksSection />
      <PricingSection />
      <CaseStudiesSection />
      <FAQSection />
      <FinalCTASection />
      <BannerDisplay position="bottom" pageSlug="home" />
      <BannerDisplay position="popup" pageSlug="home" />
    </MarketingLayout>
  )
}
