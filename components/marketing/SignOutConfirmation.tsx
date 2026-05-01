'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from './SignOutConfirmation.module.css'

export default function SignOutConfirmation() {
  const searchParams = useSearchParams()
  const justSignedOut = searchParams.get('signed_out') === '1'
  const [visible, setVisible] = useState(justSignedOut)

  useEffect(() => {
    if (!justSignedOut) return
    const url = new URL(window.location.href)
    url.searchParams.delete('signed_out')
    window.history.replaceState({}, '', url.toString())

    const timer = setTimeout(() => setVisible(false), 3000)
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setVisible(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [justSignedOut])

  if (!visible) return null

  return (
    <>
      <div className={styles.overlay} onClick={() => setVisible(false)}>
        <div
          className={styles.card}
          onClick={e => e.stopPropagation()}
          role="alert"
          aria-label="Sign-out confirmation"
        >
          <div className={styles.checkCircle}>✓</div>
          <h2 className={styles.title}>Signed out</h2>
          <p className={styles.sub}>You&apos;ve been successfully signed out of Glyphic.</p>
          <div className={styles.progressTrack}>
            <div className={styles.progressBar} />
          </div>
        </div>
      </div>
      <div className={styles.toast} aria-hidden="true">
        <span className={styles.toastDot}>✓</span>
        Signed out successfully
      </div>
    </>
  )
}
