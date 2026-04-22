import type { Metadata } from 'next'
import { RootProvider } from 'fumadocs-ui/provider'
import { ThemeProvider } from '@/lib/theme'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('glyphic-theme');if(t&&['warm','dark-tech','indigo'].includes(t))document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider>
          <RootProvider>{children}</RootProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
