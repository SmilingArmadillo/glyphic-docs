import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Glyphic Privacy Policy — how we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1>Privacy Policy</h1>
      <p>Coming soon.</p>
    </main>
  )
}
