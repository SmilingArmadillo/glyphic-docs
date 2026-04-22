import type { Metadata } from 'next'
import Link from 'next/link'
import DocsNav from '@/components/DocsNav'
import DocsFooter from '@/components/DocsFooter'
import { blog } from '@/lib/source'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Product news, tutorials, and everything Glyphic.',
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

export default function BlogIndexPage() {
  const posts = blog
    .getPages()
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())

  if (posts.length === 0) {
    return (
      <>
        <DocsNav />
        <main className="max-w-3xl mx-auto px-6 py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6366F1] mb-3">Blog</p>
          <h1 className="text-4xl font-bold tracking-tight text-[#111] mb-2">Updates &amp; guides</h1>
          <p className="text-[15px] text-[#6B6B6B] mb-12">Product news, tutorials, and everything Glyphic.</p>
          <p className="text-[#999] text-sm">No posts yet.</p>
        </main>
        <DocsFooter />
      </>
    )
  }

  const [featured, ...rest] = posts

  return (
    <>
      <DocsNav />
      <main className="max-w-3xl mx-auto px-6 py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6366F1] mb-3">Blog</p>
        <h1 className="text-4xl font-bold tracking-tight text-[#111] mb-2">Updates &amp; guides</h1>
        <p className="text-[15px] text-[#6B6B6B] mb-12">Product news, tutorials, and everything Glyphic.</p>

        <Link
          href={featured.url}
          className="block mb-8 rounded-xl border border-[#E5E3DA] bg-[#F9F8F3] hover:border-[#6366F1] hover:shadow-[0_0_0_4px_rgba(99,102,241,0.08)] transition-all overflow-hidden"
        >
          <div className="h-[120px] bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] flex items-center justify-center">
            <svg aria-hidden="true" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.5}>
              <rect x="8" y="10" width="12" height="8" rx="2" />
              <rect x="28" y="10" width="12" height="8" rx="2" />
              <rect x="18" y="30" width="12" height="8" rx="2" />
              <line x1="14" y1="18" x2="24" y2="30" />
              <line x1="34" y1="18" x2="24" y2="30" />
            </svg>
          </div>
          <div className="p-6">
            <TagPill tag={featured.data.tag} />
            <p className="text-[11.5px] text-[#999] mt-2 mb-1">{formatDate(featured.data.date)}</p>
            <h2 className="text-xl font-bold text-[#111] leading-snug mb-2">{featured.data.title}</h2>
            <p className="text-[13.5px] text-[#666] leading-relaxed">{featured.data.description}</p>
          </div>
        </Link>

        {rest.length > 0 && (
          <div className="flex flex-col gap-1">
            {rest.map((post) => (
              <Link
                key={post.url}
                href={post.url}
                className="flex items-center gap-4 px-4 py-3 rounded-lg border border-[#E5E3DA] bg-[#F9F8F3] hover:bg-[#F3F1E8] hover:border-[#6366F1] transition-all"
              >
                <span className="text-[11.5px] text-[#999] w-28 shrink-0">{formatDate(post.data.date)}</span>
                <TagPill tag={post.data.tag} />
                <span className="flex-1 text-[13.5px] font-medium text-[#1A1A1A]">{post.data.title}</span>
                <span aria-hidden="true" className="text-[#C0BDB4] text-sm">→</span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <DocsFooter />
    </>
  )
}
