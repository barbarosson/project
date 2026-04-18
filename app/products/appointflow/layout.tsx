import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Modulus AppointFlow — Autonomous Appointment Agent on WhatsApp',
  description:
    'Modulus AppointFlow books, reminds, cancels and upsells client appointments automatically over WhatsApp and Google Calendar — 9 languages, 24/7, from $29/month. 7-day free trial, no credit card required.',
  openGraph: {
    title: 'Modulus AppointFlow — Autonomous Appointment Agent',
    description:
      'AI agent that answers WhatsApp 24/7 and books Google Calendar appointments for service businesses. From $29/month.',
    type: 'website',
    url: 'https://modulusaas.com/products/appointflow',
    siteName: 'Modulus',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Modulus AppointFlow — Autonomous Appointment Agent',
    description: 'Books appointments on WhatsApp + Google Calendar, 24/7, 9 languages.',
  },
  alternates: {
    canonical: 'https://modulusaas.com/products/appointflow',
  },
}

export default function AppointFlowLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
