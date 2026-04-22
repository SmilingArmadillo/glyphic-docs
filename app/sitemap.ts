import type { MetadataRoute } from 'next'
import { source, blog } from '@/lib/source'

export default function sitemap(): MetadataRoute.Sitemap {
  const docPages = source.getPages().map((page) => ({
    url: `https://glyphic.cc${page.url}`,
    lastModified: new Date('2026-04-22'),
    changeFrequency: 'weekly' as const,
    priority: page.url === '/docs' ? 1.0 : 0.8,
  }))

  const blogIndex = {
    url: 'https://glyphic.cc/blog',
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }

  const blogPages = blog.getPages().map((page) => ({
    url: `https://glyphic.cc${page.url}`,
    lastModified: page.data.date,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [blogIndex, ...blogPages, ...docPages]
}
