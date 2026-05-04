'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import TopNav from '@/components/marketing/TopNav'
import Footer from '@/components/marketing/Footer'
import styles from '@/components/marketing/MarketingLayout.module.css'

interface Props {
  user: User | null
  children: React.ReactNode
}

export default function MarketingLayoutClient({ user, children }: Props) {
  const pathname = usePathname()
  const isLanding = pathname === '/'
  const [atTop, setAtTop] = useState(() => isLanding && (typeof window !== 'undefined' ? window.scrollY === 0 : true))

  useEffect(() => {
    if (!isLanding) {
      setAtTop(false)
      return
    }
    setAtTop(window.scrollY === 0)
    const onScroll = () => setAtTop(window.scrollY === 0)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isLanding])

  const navWrapClass = [
    styles['nav-wrap'],
    !isLanding ? styles['nav-wrap--static'] : atTop ? styles['nav-wrap--top'] : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.layout} data-marketing>
      <div className={navWrapClass}>
        <TopNav user={user} atTop={!isLanding || atTop} />
      </div>
      <main className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
