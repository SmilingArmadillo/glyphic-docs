'use client'

import Link from 'next/link'
import Image from 'next/image'
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
    <header className="flex items-center justify-between px-6 h-14 bg-[#FAF9F4] dark:bg-[#0F0F0F] border-b border-[#E5E3DA] dark:border-[#2A2A2A]">
      <div className="flex items-center gap-6">
        <Link href="https://glyphic.cc" className="flex items-center">
          <Image src="/glyphic-header-light.svg" alt="Glyphic" width={186} height={30} className="dark:hidden" />
          <Image src="/glyphic-header-dark.svg" alt="Glyphic" width={186} height={30} className="hidden dark:block" />
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href === '/docs' && pathname.startsWith('/docs'))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  isActive
                    ? 'text-[#6366F1] font-medium'
                    : 'text-[#6B6B6B] dark:text-[#9CA3AF] hover:text-[#1A1A1A] dark:hover:text-[#F5F5F0]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="https://glyphic.cc/login"
          className="text-sm text-[#6B6B6B] dark:text-[#9CA3AF] hover:text-[#1A1A1A] dark:hover:text-[#F5F5F0] transition-colors"
        >
          Login
        </Link>
        <Link
          href="https://glyphic.cc/app"
          className="px-4 py-1.5 text-sm font-medium text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-full transition-colors"
        >
          Open editor →
        </Link>
      </div>
    </header>
  )
}
