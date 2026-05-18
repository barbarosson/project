import { Metadata } from 'next'
import { CorporateHomeLayout } from '@/components/marketing/corporate-home-layout'
import { corporateCopy } from '@/lib/corporate-marketing-copy'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: corporateCopy.en.meta.homeTitle,
  description: corporateCopy.en.meta.homeDescription,
  openGraph: {
    title: corporateCopy.en.meta.homeTitle,
    description: corporateCopy.en.meta.homeDescription,
    type: 'website',
  },
}

export default function HomePage() {
  return <CorporateHomeLayout />
}
