import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Changelog',
  description: "What's new in Glyphic — release notes, improvements, and bug fixes.",
}

export default function ChangelogPage() {
  return (
    <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1>Changelog</h1>
      <p>Coming soon.</p>
    </main>
  )
}
