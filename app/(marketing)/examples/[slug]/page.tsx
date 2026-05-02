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
    description: `Explore the ${title} Mermaid diagram example — built and animated with Glyphic.`,
  }
}

export default function ExamplePage() {
  return (
    <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1>Example</h1>
      <p>Coming soon.</p>
    </main>
  )
}
