import { Metadata } from 'next'
import { IsendaiProductContent } from '@/components/marketing/isendai-product-content'
import { corporateCopy } from '@/lib/corporate-marketing-copy'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: corporateCopy.en.isendaiPage.metaTitle,
  description: corporateCopy.en.isendaiPage.metaDescription,
  openGraph: {
    title: corporateCopy.en.isendaiPage.metaTitle,
    description: corporateCopy.en.isendaiPage.metaDescription,
    type: 'website',
  },
}

export default function IsendaiProductPage() {
  return <IsendaiProductContent />
}
