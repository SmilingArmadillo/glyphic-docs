import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Use Cases',
  description:
    'Discover how teams use Glyphic to visualise architectures, incident timelines, onboarding flows, and more.',
}

export default function UseCasesPage() {
  return (
    <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1>Use Cases</h1>
      <p>Coming soon.</p>
    </main>
  )
}
