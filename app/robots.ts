import type { MetadataRoute } from 'next'

function getBaseUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    'http://localhost:3000'

  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

