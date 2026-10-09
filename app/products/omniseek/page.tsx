import { Metadata } from 'next'
import { OmniSeekProductContent } from '@/components/marketing/omniseek-product-content'
import { corporateCopy } from '@/lib/corporate-marketing-copy'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: corporateCopy.en.omniseekPage.metaTitle,
  description: corporateCopy.en.omniseekPage.metaDescription,
  openGraph: {
    title: corporateCopy.en.omniseekPage.metaTitle,
    description: corporateCopy.en.omniseekPage.metaDescription,
    type: 'website',
  },
}

export default function OmniSeekProductPage() {
  return <OmniSeekProductContent />
}
