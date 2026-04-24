import type { Metadata } from 'next'
import { RootProvider } from 'fumadocs-ui/provider'
import DocsNav from '@/components/DocsNav'
import NavTiming from '@/components/NavTiming'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://glyphic.cc'),
  title: {
    template: '%s — Glyphic',
    default: 'Glyphic Docs',
  },
  description: 'Documentation for Glyphic — the visual Mermaid diagram editor.',
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Glyphic',
  url: 'https://glyphic.cc',
  logo: 'https://glyphic.cc/logo.svg',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body>
        <RootProvider>
          <NavTiming />
          <DocsNav user={user} />
          {children}
        </RootProvider>
      </body>
    </html>
  )
}
