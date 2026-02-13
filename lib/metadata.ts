import { Metadata } from 'next'

const defaultMetadata = {
  title: 'MODULUS - Smart ERP & CRM Suite',
  description: 'Professional SaaS-based modular ERP and CRM application for modern businesses. Streamline operations, boost productivity, and drive growth.',
  ogImage: '/logo_slogan_ingilizce.png',
}

export async function getPageMetadata(slug: string): Promise<Metadata> {
  return {
    title: defaultMetadata.title,
    description: defaultMetadata.description,
    openGraph: {
      title: defaultMetadata.title,
      description: defaultMetadata.description,
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
      title: defaultMetadata.title,
      description: defaultMetadata.description,
      images: [defaultMetadata.ogImage],
    },
  }
}

export function getSlugFromPath(pathname: string): string {
  if (pathname === '/') return 'home'
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '')
  return slug || 'home'
}
