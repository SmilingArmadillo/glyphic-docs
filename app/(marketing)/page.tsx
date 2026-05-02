import type { Metadata } from 'next'
import { Suspense } from 'react'
import LandingPage from '@/components/marketing/LandingPage'

export const metadata: Metadata = {
  title: { absolute: 'Glyphic — Visual Mermaid Diagram Editor' },
  description:
    'Glyphic is the visual editor for Mermaid diagrams. Add animations, status overlays, style blocks, and more — then share with a single link.',
  openGraph: {
    title: 'Glyphic — Visual Mermaid Diagram Editor',
    description:
      'Add animations, status overlays, and style blocks to your Mermaid diagrams. Share with a single link.',
    url: 'https://glyphic.cc',
    siteName: 'Glyphic',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Glyphic diagram editor' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Glyphic — Visual Mermaid Diagram Editor',
    description: 'The visual editor for Mermaid diagrams.',
    images: ['/og.png'],
  },
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  )
}
