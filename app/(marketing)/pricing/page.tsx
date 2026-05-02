import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for Glyphic. Start free, upgrade when you need more.',
}

export default function PricingPage() {
  return (
    <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1>Pricing</h1>
      <p>Coming soon.</p>
    </main>
  )
}
