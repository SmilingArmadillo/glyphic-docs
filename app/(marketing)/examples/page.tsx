import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Examples',
  description:
    'Browse interactive Mermaid diagram examples built with Glyphic — from flowcharts and sequence diagrams to animated system maps.',
}

export default function ExamplesPage() {
  return (
    <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1>Examples</h1>
      <p>Coming soon.</p>
    </main>
  )
}
