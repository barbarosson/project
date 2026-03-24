import { Metadata } from 'next'
import { getPageMetadata } from '@/lib/metadata'
import { PricingPageClient } from './pricing-page-client'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('pricing')
}

export default function PricingPage() {
  return <PricingPageClient />
}
