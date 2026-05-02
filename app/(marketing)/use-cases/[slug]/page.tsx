import type { Metadata } from 'next'

export const dynamic = 'force-static'

function humaniseSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const title = humaniseSlug(params.slug)
  return {
    title,
    description: `Learn how ${title} is tackled with Glyphic — interactive, animated Mermaid diagrams.`,
  }
}

export default function UseCasePage() {
  return (
    <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1>Use Case</h1>
      <p>Coming soon.</p>
    </main>
  )
}
