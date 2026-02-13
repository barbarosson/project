import { Metadata } from 'next'
import { getPageMetadata } from '@/lib/metadata'
import { HomePageContent } from '@/components/home-page-content'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('home')
}

export default function HomePage() {
  return <HomePageContent />
}
