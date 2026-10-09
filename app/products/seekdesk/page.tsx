import { Metadata } from 'next'
import { SeekDeskProductContent } from '@/components/marketing/seekdesk-product-content'
import { corporateCopy } from '@/lib/corporate-marketing-copy'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: corporateCopy.en.seekdeskPage.metaTitle,
  description: corporateCopy.en.seekdeskPage.metaDescription,
  openGraph: {
    title: corporateCopy.en.seekdeskPage.metaTitle,
    description: corporateCopy.en.seekdeskPage.metaDescription,
    type: 'website',
  },
}

export default function SeekDeskProductPage() {
  return <SeekDeskProductContent />
}
