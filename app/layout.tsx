import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { RootProvider } from 'fumadocs-ui/provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
