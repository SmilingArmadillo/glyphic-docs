'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Product', href: 'https://glyphic.cc/#features' },
  { label: 'Docs', href: '/docs' },
  { label: 'Examples', href: 'https://glyphic.cc/examples' },
  { label: 'Use cases', href: 'https://glyphic.cc/use-cases' },
  { label: 'Blog', href: 'https://glyphic.cc/blog' },
  { label: 'Pricing', href: 'https://glyphic.cc/pricing' },
]

export default function DocsNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 flex justify-center px-4 py-3 bg-[#FAF9F4]/90 dark:bg-[#0F0F0F]/90 backdrop-blur border-b border-[#E5E3DA] dark:border-[#2A2A2A]">
      <nav className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#E5E3DA] dark:border-[#2A2A2A] bg-white/70 dark:bg-[#161616]/70 backdrop-blur">
        <Link
          href="https://glyphic.cc"
          className="mr-3 font-serif italic font-semibold text-[#1A1A1A] dark:text-[#F5F5F0] text-lg"
        >
          Glyphic
        </Link>

        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || (link.href === '/docs' && pathname.startsWith('/docs'))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                isActive
                  ? 'bg-[#6366F1] text-white'
                  : 'text-[#1A1A1A] dark:text-[#F5F5F0] hover:bg-[#F0EFE9] dark:hover:bg-[#1A1A1A]'
              }`}
            >
              {link.label}
            </Link>
          )
        })}

        <span className="w-px h-4 bg-[#E5E3DA] dark:bg-[#2A2A2A] mx-1" />

        <Link
          href="https://glyphic.cc/login"
          className="px-3 py-1 text-sm text-[#1A1A1A] dark:text-[#F5F5F0] hover:bg-[#F0EFE9] dark:hover:bg-[#1A1A1A] rounded-full transition-colors"
        >
          Login
        </Link>

        <Link
          href="https://glyphic.cc/app"
          className="px-4 py-1.5 text-sm font-medium text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-full transition-colors"
        >
          Open editor →
        </Link>
      </nav>
    </header>
  )
}
