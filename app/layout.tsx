import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClientProviders } from '@/components/client-providers'

// v2.3 - Theme sync: 1739350000 (cache bust)
export const dynamic = 'force-dynamic'
export const revalidate = 0

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://modulus.tech'),
  title: {
    default: 'MODULUS - Smart ERP & CRM Suite',
    template: '%s | MODULUS',
  },
  description: 'Professional SaaS-based modular ERP and CRM application for modern businesses. Streamline operations, boost productivity, and drive growth.',
  keywords: ['ERP', 'CRM', 'Business Management', 'SaaS', 'Cloud Software', 'Modulus'],
  authors: [{ name: 'Modulus Technologies' }],
  creator: 'Modulus Technologies',
  publisher: 'Modulus Technologies',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'MODULUS',
    title: 'MODULUS - Smart ERP & CRM Suite',
    description: 'Professional SaaS-based modular ERP and CRM application for modern businesses.',
    images: [
      {
        url: '/logo_slogan_ingilizce.png',
        width: 1200,
        height: 630,
        alt: 'MODULUS - Smart ERP & CRM Suite',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MODULUS - Smart ERP & CRM Suite',
    description: 'Professional SaaS-based modular ERP and CRM application for modern businesses.',
    images: ['/logo_slogan_ingilizce.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MODULUS',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0A2540',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} font-inter text-[#0A2540] bg-[#0A2540]/5`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
