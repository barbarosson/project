import { Metadata } from 'next'
import { getPageMetadata } from '@/lib/metadata'
import { HomePageContent } from '@/components/home-page-content'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('modulus-erp')
}

export default function ModulusErpProductPage() {
  return <HomePageContent />
}
