'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { LanguageProvider } from '@/contexts/language-context'
import { TenantProvider } from '@/contexts/tenant-context'
import { CurrencyProvider } from '@/contexts/currency-context'
import { NotificationProvider } from '@/contexts/notification-context'
import { SubscriptionProvider } from '@/contexts/subscription-context'
import { SiteConfigProvider } from '@/contexts/site-config-context'
import { ThemeProvider } from '@/components/theme-provider'
import { LiveChatWidget } from '@/components/live-chat-widget'
import { DynamicSEOHead } from '@/components/dynamic-seo-head'
import { StickyBar } from '@/components/marketing/sticky-bar'
import { LeadPopup } from '@/components/marketing/lead-popup'
import { UIStyleInjector } from '@/components/ui-style-injector'
import { PageTransitionLogo } from '@/components/page-transition-logo'
import { Toaster } from 'sonner'

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TenantProvider>
        <SubscriptionProvider>
          <SiteConfigProvider>
            <ThemeProvider>
              <LanguageProvider>
                <CurrencyProvider>
                  <NotificationProvider>
                    <UIStyleInjector />
                    <DynamicSEOHead />
                    <StickyBar />
                    <LeadPopup />
                    <PageTransitionLogo />
                    {children}
                    <LiveChatWidget />
                    <Toaster position="top-right" richColors />
                  </NotificationProvider>
                </CurrencyProvider>
              </LanguageProvider>
            </ThemeProvider>
          </SiteConfigProvider>
        </SubscriptionProvider>
      </TenantProvider>
    </AuthProvider>
  )
}
