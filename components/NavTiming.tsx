'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function NavTiming() {
  const pathname = usePathname()
  const startRef = useRef<number>(Date.now())
  const prevPath = useRef<string>(pathname)

  useEffect(() => {
    const now = Date.now()
    if (prevPath.current !== pathname) {
      const elapsed = now - startRef.current
      console.log(`[NavTiming] client received ${pathname} in ${elapsed}ms (from ${prevPath.current})`)
      prevPath.current = pathname
    }
    startRef.current = now
  }, [pathname])

  // Capture when a link is clicked to start the timer
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest('a')
      if (a && a.href && !a.href.startsWith('http') || (a?.href.includes('localhost'))) {
        startRef.current = Date.now()
        console.log(`[NavTiming] click on ${a?.getAttribute('href')} at ${startRef.current}`)
      }
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
