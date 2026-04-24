'use client'

import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'
import NavUserMenu from '@/components/NavUserMenu'

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

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center rounded-full border border-[#E5E3DA] dark:border-[#2A2A2A] p-1 overflow-hidden"
      suppressHydrationWarning
    >
      <Sun
        fill="currentColor"
        suppressHydrationWarning
        className={`size-4 p-0.5 rounded-full transition-colors ${!isDark ? 'bg-fd-accent text-fd-accent-foreground' : 'text-[#6B6B6B] dark:text-[#9CA3AF]'}`}
      />
      <Moon
        fill="currentColor"
        suppressHydrationWarning
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 90" width="186" height="30" aria-label="Glyphic" className="dark:hidden">
            <g transform="translate(-93.55 -63.46) scale(0.2308)">
              <path fill="none" stroke="#5B4FE9" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" d="M 440 340 L 640 340 L 720 420 L 720 520 L 640 600 L 540 600 L 540 520 L 620 520"/>
              <circle cx="440" cy="340" r="22" fill="#5B4FE9"/>
              <circle cx="640" cy="340" r="22" fill="#5B4FE9"/>
              <circle cx="720" cy="420" r="22" fill="#5B4FE9"/>
              <circle cx="720" cy="520" r="22" fill="#5B4FE9"/>
              <circle cx="640" cy="600" r="22" fill="#5B4FE9"/>
              <circle cx="540" cy="600" r="22" fill="#5B4FE9"/>
              <circle cx="540" cy="520" r="22" fill="#5B4FE9"/>
              <circle cx="620" cy="520" r="22" fill="#5B4FE9"/>
            </g>
            <text x="92" y="70" fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize="88">
              <tspan fill="#111111">glyphic</tspan><tspan fill="#5B4FE9">.cc</tspan>
            </text>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 90" width="186" height="30" aria-label="Glyphic" className="hidden dark:block">
            <g transform="translate(-93.55 -63.46) scale(0.2308)">
              <path fill="none" stroke="oklch(0.78 0.14 240)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" d="M 440 340 L 640 340 L 720 420 L 720 520 L 640 600 L 540 600 L 540 520 L 620 520"/>
              <circle cx="440" cy="340" r="22" fill="oklch(0.78 0.14 240)"/>
              <circle cx="640" cy="340" r="22" fill="oklch(0.78 0.14 240)"/>
              <circle cx="720" cy="420" r="22" fill="oklch(0.78 0.14 240)"/>
              <circle cx="720" cy="520" r="22" fill="oklch(0.78 0.14 240)"/>
              <circle cx="640" cy="600" r="22" fill="oklch(0.78 0.14 240)"/>
              <circle cx="540" cy="600" r="22" fill="oklch(0.78 0.14 240)"/>
              <circle cx="540" cy="520" r="22" fill="oklch(0.78 0.14 240)"/>
              <circle cx="620" cy="520" r="22" fill="oklch(0.78 0.14 240)"/>
            </g>
            <text x="92" y="70" fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize="88">
              <tspan fill="oklch(0.96 0.01 80)">glyphic</tspan><tspan fill="oklch(0.78 0.14 240)">.cc</tspan>
            </text>
          </svg>
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
        <NavUserMenu />
      </div>
    </header>
  )
}
