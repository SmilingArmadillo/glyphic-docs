'use client'

import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

const isDev = process.env.NODE_ENV === 'development'
const app = (path: string) => isDev ? path : `https://glyphic.cc${path}`

const NAV_LINKS = [
  { label: 'Product', href: app('/#features'), prefix: null },
  { label: 'Docs', href: '/docs', prefix: '/docs' },
  { label: 'Examples', href: app('/examples'), prefix: null },
  { label: 'Use cases', href: app('/use-cases'), prefix: null },
  { label: 'Blog', href: app('/blog'), prefix: '/blog' },
  { label: 'Pricing', href: app('/pricing'), prefix: null },
]

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted ? resolvedTheme === 'dark' : false

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center rounded-full border border-[#E5E3DA] dark:border-[#2A2A2A] p-1 overflow-hidden"
    >
      <Sun
        fill="currentColor"
        className={`size-4 p-0.5 rounded-full transition-colors ${!isDark ? 'bg-fd-accent text-fd-accent-foreground' : 'text-[#6B6B6B] dark:text-[#9CA3AF]'}`}
      />
      <Moon
        fill="currentColor"
        className={`size-4 p-0.5 rounded-full transition-colors ${isDark ? 'bg-fd-accent text-fd-accent-foreground' : 'text-[#6B6B6B] dark:text-[#9CA3AF]'}`}
      />
    </button>
  )
}

export default function DocsNav() {
  const pathname = usePathname()

  return (
    <header className="flex items-center justify-between px-6 h-14 bg-[#FAF9F4] dark:bg-[#0F0F0F] border-b border-[#E5E3DA] dark:border-[#2A2A2A]">
      <div className="flex items-center gap-6">
        <a href={app('/')} className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/glyphic-header-light.svg" alt="Glyphic" width={186} height={30} className="dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/glyphic-header-dark.svg" alt="Glyphic" width={186} height={30} className="hidden dark:block" />
        </a>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = link.prefix ? pathname.startsWith(link.prefix) : false
            return (
              <a
                key={link.label}
                href={link.href}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[#1A1A1A] dark:text-[#F5F5F0]'
                    : 'text-[#6B6B6B] dark:text-[#9CA3AF] hover:text-[#1A1A1A] dark:hover:text-[#F5F5F0]'
                }`}
              >
                {link.label}
              </a>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <a
          href={app('/login')}
          className="text-sm font-medium text-[#6B6B6B] dark:text-[#9CA3AF] hover:text-[#1A1A1A] dark:hover:text-[#F5F5F0] transition-colors"
        >
          Login
        </a>
        <a
          href={app('/app')}
          className="px-4 py-2 text-sm font-medium text-white bg-[#6366F1] rounded-full transition-[transform,box-shadow] duration-150 ease-out hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
        >
          Open editor →
        </a>
      </div>
    </header>
  )
}
