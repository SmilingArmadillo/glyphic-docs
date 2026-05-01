'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import NavUserMenu from '@/components/NavUserMenu'
import styles from './TopNav.module.css'

function GlyphicLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 90" aria-label="Glyphic" role="img" className={styles['logo-img']}>
      <style>{`
        @keyframes gh-tw-once{ 0%{opacity:.35} 50%{opacity:1} 100%{opacity:1} }
        .gh-dot{ animation: gh-tw-once 1.2s ease-out 1 both }
      `}</style>
      <g transform="translate(-93.55 -63.46) scale(0.2308)">
        <path fill="none" stroke="#5B4FE9" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"
              d="M 440 340 L 640 340 L 720 420 L 720 520 L 640 600 L 540 600 L 540 520 L 620 520"/>
        <circle className="gh-dot" cx="440" cy="340" r="22" fill="#5B4FE9" style={{animationDelay:'0.00s'}}/>
        <circle className="gh-dot" cx="640" cy="340" r="22" fill="#5B4FE9" style={{animationDelay:'0.15s'}}/>
        <circle className="gh-dot" cx="720" cy="420" r="22" fill="#5B4FE9" style={{animationDelay:'0.30s'}}/>
        <circle className="gh-dot" cx="720" cy="520" r="22" fill="#5B4FE9" style={{animationDelay:'0.45s'}}/>
        <circle className="gh-dot" cx="640" cy="600" r="22" fill="#5B4FE9" style={{animationDelay:'0.60s'}}/>
        <circle className="gh-dot" cx="540" cy="600" r="22" fill="#5B4FE9" style={{animationDelay:'0.75s'}}/>
        <circle className="gh-dot" cx="540" cy="520" r="22" fill="#5B4FE9" style={{animationDelay:'0.90s'}}/>
        <circle className="gh-dot" cx="620" cy="520" r="22" fill="#5B4FE9" style={{animationDelay:'1.05s'}}/>
      </g>
      <text x="92" y="70" fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize="88">
        <tspan fill="#111111">glyphic</tspan><tspan fill="#5B4FE9">.cc</tspan>
      </text>
    </svg>
  )
}

const NAV_LINKS = [
  { label: 'Product', href: '/#meta-language', prefix: null },
  { label: 'Docs', href: '/docs', prefix: '/docs' },
  { label: 'Examples', href: '/examples', prefix: '/examples' },
  { label: 'Use cases', href: '/use-cases', prefix: '/use-cases' },
  { label: 'Blog', href: '/blog', prefix: '/blog' },
  { label: 'Pricing', href: '/pricing', prefix: '/pricing' },
]

interface Props {
  user: User | null
  atTop?: boolean
}

export default function TopNav({ user, atTop = false }: Props) {
  const pathname = usePathname()

  return (
    <nav className={`${styles.nav}${atTop ? ` ${styles['nav--top']}` : ''}`}>
      <div className={styles.left}>
        <Link href="/" className={styles.logo}>
          <GlyphicLogo />
        </Link>
        <div className={styles.links}>
          {NAV_LINKS.map(({ label, href, prefix }) => {
            const isActive = prefix ? pathname.startsWith(prefix) : false
            return (
              <Link
                key={label}
                href={href}
                className={`${styles.link}${isActive ? ` ${styles.active}` : ''}`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
      <div className={styles.right}>
        <NavUserMenu user={user} />
      </div>
    </nav>
  )
}
