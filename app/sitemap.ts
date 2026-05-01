import type { MetadataRoute } from 'next'
import { source, blog } from '@/lib/source'

export default function sitemap(): MetadataRoute.Sitemap {
  const docPages = source.getPages().map((page) => ({
    url: `https://glyphic.cc${page.url}`,
    lastModified: new Date('2026-04-22'),
    changeFrequency: 'weekly' as const,
    priority: page.url === '/docs' ? 1.0 : 0.8,
  }))

  const mostRecentPost = blog.getPages().sort((a, b) => b.data.date.getTime() - a.data.date.getTime())[0]

  const blogIndex = {
    url: 'https://glyphic.cc/blog',
    lastModified: mostRecentPost ? mostRecentPost.data.date : new Date('2026-04-22'),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }

  const blogPages = blog.getPages().map((page) => ({
    url: `https://glyphic.cc${page.url}`,
    lastModified: page.data.date,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const marketingPages: MetadataRoute.Sitemap = [
    { url: 'https://glyphic.cc/', lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: 'https://glyphic.cc/pricing', lastModified: new Date('2026-04-22'), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://glyphic.cc/examples', lastModified: new Date('2026-04-22'), changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://glyphic.cc/use-cases', lastModified: new Date('2026-04-22'), changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://glyphic.cc/changelog', lastModified: new Date('2026-04-22'), changeFrequency: 'weekly', priority: 0.6 },
    { url: 'https://glyphic.cc/privacy', lastModified: new Date('2026-04-22'), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://glyphic.cc/terms', lastModified: new Date('2026-04-22'), changeFrequency: 'yearly', priority: 0.3 },
  ]

  return [...marketingPages, blogIndex, ...blogPages, ...docPages]
}
