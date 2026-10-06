import { Metadata } from 'next'
import { DigitalLegacyProductContent } from '@/components/marketing/digital-legacy-product-content'
import { corporateCopy } from '@/lib/corporate-marketing-copy'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: corporateCopy.en.digitalLegacyPage.metaTitle,
  description: corporateCopy.en.digitalLegacyPage.metaDescription,
  openGraph: {
    title: corporateCopy.en.digitalLegacyPage.metaTitle,
    description: corporateCopy.en.digitalLegacyPage.metaDescription,
    type: 'website',
  },
}

export default function DigitalLegacyProductPage() {
  return <DigitalLegacyProductContent />
}
