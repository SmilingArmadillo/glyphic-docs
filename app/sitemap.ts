import type { MetadataRoute } from 'next'
import { source } from '@/lib/source'

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = source.getPages()
  return pages.map((page) => ({
    url: `https://glyphic.cc${page.url}`,
    lastModified: new Date('2026-04-22'),
    changeFrequency: 'weekly',
    priority: page.url === '/docs' ? 1.0 : 0.8,
  }))
}
