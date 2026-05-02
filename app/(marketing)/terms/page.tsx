import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Glyphic Terms of Service — the rules governing use of the Glyphic platform.',
}

export default function TermsPage() {
  return (
    <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1>Terms of Service</h1>
      <p>Coming soon.</p>
    </main>
  )
}
