import { ReactNode } from 'react'
import { MarketingHeader } from './marketing-header'
import { MarketingFooter } from './marketing-footer'
import { UIStyleInjector } from '@/components/ui-style-injector'

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <UIStyleInjector />
      <div className="min-h-screen flex flex-col">
        <MarketingHeader />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </>
  )
}
