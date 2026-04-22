import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { source } from '@/lib/source'
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from 'fumadocs-ui/page'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import GlassCard from '@/components/GlassCard'

interface Props {
  params: { slug?: string[] }
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const slugPath = params.slug?.join('/') ?? ''

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      title: page.data.title,
      description: page.data.description ?? undefined,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: page.data.title,
      description: page.data.description ?? undefined,
    },
    alternates: {
      canonical: `https://glyphic.cc/docs${slugPath ? `/${slugPath}` : ''}`,
    },
  }
}

export default async function Page({ params }: Props) {
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: page.data.title,
    description: page.data.description,
    inLanguage: 'en',
    author: { '@type': 'Organization', name: 'Glyphic', url: 'https://glyphic.cc' },
    publisher: { '@type': 'Organization', name: 'Glyphic', url: 'https://glyphic.cc' },
    datePublished: '2026-04-22',
    dateModified: '2026-04-22',
  }

  return (
    <DocsPage toc={page.data.toc} tableOfContent={{ style: 'clerk' }} tableOfContentPopover={{ style: 'clerk' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents, GlassCard }} />
      </DocsBody>
    </DocsPage>
  )
}
