import { Metadata } from 'next'
import { UplinkFtpProductContent } from '@/components/marketing/uplink-ftp-product-content'
import { corporateCopy } from '@/lib/corporate-marketing-copy'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: corporateCopy.en.uplinkFtpPage.metaTitle,
  description: corporateCopy.en.uplinkFtpPage.metaDescription,
  alternates: { canonical: 'https://modulusaas.com/products/uplink-ftp' },
  openGraph: {
    title: corporateCopy.en.uplinkFtpPage.metaTitle,
    description: corporateCopy.en.uplinkFtpPage.metaDescription,
    type: 'website',
  },
}

export default function UplinkFtpProductPage() {
  return <UplinkFtpProductContent />
}
