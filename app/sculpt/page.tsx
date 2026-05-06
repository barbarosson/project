import type { Metadata } from 'next'
import { SculptPageClient } from './sculpt-page-client'

export const metadata: Metadata = {
  title: 'Sculpt 2026',
  description: 'The go-to-market conference returns in 2026.',
}

export default function SculptPage() {
  return <SculptPageClient />
}

