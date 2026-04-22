import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { blog } from '@/lib/source'
import { mdxComponents } from '@/components/mdx-components'
import DocsNav from '@/components/DocsNav'
import DocsFooter from '@/components/DocsFooter'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return blog
    .getPages()
    .filter((page) => page.slugs.length === 1)
    .map((page) => ({ slug: page.slugs[0] }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = blog.getPage([params.slug])
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      type: 'article',
    },
    alternates: {
      canonical: `https://glyphic.cc/blog/${params.slug}`,
    },
  }
}

function TagPill({ tag }: { tag: 'update' | 'tutorial' }) {
  const styles = {
    update: 'bg-[#EEF2FF] text-[#4F46E5]',
    tutorial: 'bg-[#F0FDF4] text-[#16A34A]',
  }
  const labels = { update: 'Update', tutorial: 'Tutorial' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.04em] ${styles[tag]}`}>
      {labels[tag]}
    </span>
  )
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BlogPostPage({ params }: Props) {
  const page = blog.getPage([params.slug])
  if (!page) notFound()

  const MDX = page.data.body

  return (
    <>
      <DocsNav />
      <main className="max-w-2xl mx-auto px-6 py-14">
        <Link
          href="/blog"
          className="text-[12px] text-[#6B6B6B] hover:text-[#6366F1] transition-colors mb-8 inline-block"
        >
          <span aria-hidden="true">← </span>Back to blog
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <TagPill tag={page.data.tag} />
          <span className="text-[11.5px] text-[#999]">{formatDate(page.data.date)}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#111] leading-snug mb-6">
          {page.data.title}
        </h1>
        <div className="prose prose-neutral max-w-none text-[15px] leading-relaxed">
          <MDX components={mdxComponents} />
        </div>
      </main>
      <DocsFooter />
    </>
  )
}
