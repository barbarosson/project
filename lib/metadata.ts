import { Metadata } from 'next'

const defaultMetadata = {
  title: 'MODULUS — Technology products by Songurtech',
  description:
    'Songurtech builds MODULUS: Modulus ERP, AppointFlow, isendAI, and Digital Legacy — software for modern businesses and personal planning.',
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
  'digital-legacy': {
    title: 'Digital Legacy — Digital estate planning for Windows | MODULUS',
    description:
      'Windows desktop app for digital estate planning: assets, heirs, messages, and video diary. Download from the Microsoft Store.',
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
