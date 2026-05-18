import { Metadata } from 'next'

const defaultMetadata = {
  title: 'MODULUS — Technology products by Songurtech',
  description:
    'Songurtech builds MODULUS: Modulus ERP, AppointFlow, and isendAI — AI-powered software for modern businesses.',
  ogImage: '/icon-512.png',
}

const slugMetadata: Record<string, { title: string; description: string }> = {
  home: defaultMetadata,
  'modulus-erp': {
    title: 'Modulus ERP — Smart ERP & CRM | MODULUS',
    description:
      'Modular cloud ERP for B2B: inventory, invoicing, finance, CRM, e-invoice, and AI-assisted workflows.',
  },
  isendai: {
    title: 'isendAI — Communication intelligence | MODULUS',
    description:
      'Polish messages before you send. AI tools and concierge routing for work, relationships, and everyday life.',
  },
}

export async function getPageMetadata(slug: string): Promise<Metadata> {
  const meta = slugMetadata[slug] ?? defaultMetadata
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      images: [
        {
          url: defaultMetadata.ogImage,
          width: 1200,
          height: 630,
          alt: defaultMetadata.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [defaultMetadata.ogImage],
    },
  }
}

export function getSlugFromPath(pathname: string): string {
  if (pathname === '/') return 'home'
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '')
  return slug || 'home'
}
