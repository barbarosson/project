import type { MetadataRoute } from 'next'

function getBaseUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    'http://localhost:3000'

  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl()
  const lastModified = new Date()

  const routes: Array<{ path: string; changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency']; priority?: number }> =
    [
      { path: '/landing', changeFrequency: 'weekly', priority: 1 },
      { path: '/pricing', changeFrequency: 'weekly', priority: 0.8 },
      { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
      { path: '/login', changeFrequency: 'monthly', priority: 0.6 },
      { path: '/buy', changeFrequency: 'monthly', priority: 0.6 },

      // Legal pages (iyzico prerequisites)
      { path: '/hakkimizda', changeFrequency: 'yearly', priority: 0.4 },
      { path: '/gizlilik', changeFrequency: 'yearly', priority: 0.4 },
      { path: '/teslimat-iade', changeFrequency: 'yearly', priority: 0.4 },
      { path: '/mesafeli-satis', changeFrequency: 'yearly', priority: 0.4 },
    ]

  return routes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}

