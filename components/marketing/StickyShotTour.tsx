'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import styles from './StickyShotTour.module.css'

/**
 * StickyShotTour — sticky left screenshot + scrolling right copy layout.
 *
 * Renders a two-column section: a browser-frame mock pinned on the left via
 * `position: sticky`, and a list of feature steps scrolling on the right.
 * As the user scrolls, the active step is detected by viewport-midpoint
 * proximity and the corresponding mock slides in from below (forward) or
 * above (backward) with a 420ms CSS transition.
 *
 * Usage:
 * ```tsx
 * const STEPS: StickyShotTourStep[] = features.map(f => ({
 *   id: f.id,
 *   tag: f.tag,          // accent pill label, e.g. '@animate'
 *   heading: f.title,
 *   subhead: f.description,
 *   caps: f.bullets,     // capability checklist items
 *   tagline: f.tagline,  // italic footer line
 *   mock: <MyScreenshot feature={f} />,  // anything — img, video, custom component
 * }))
 *
 * <StickyShotTour
 *   steps={STEPS}
 *   mockUrl="glyphic.cc/editor"    // URL shown in browser chrome (default)
 *   stickyTopOffset={96}           // px from top — set to clear any sticky nav
 * />
 * ```
 *
 * The `mock` prop is a ReactNode rendered inside a clipped 360px viewport.
 * Callers own the mock content; the component owns the chrome, dots, and
 * slide transition.
 *
 * Collapses to single-column on viewports < 768px with sticky disabled.
 */
export interface StickyShotTourStep {
  id: string
  tag: string
  heading: string
  subhead: string
  caps: string[]
  tagline: string
  mock: React.ReactNode
}

interface Props {
  steps: StickyShotTourStep[]
  /** URL string shown in the browser chrome bar. Default: 'glyphic.cc/editor' */
  mockUrl?: string
  /** Distance from the top of the viewport to pin the sticky column, in px.
   *  Set this to the height of any fixed/sticky nav to avoid overlap. Default: 40 */
  stickyTopOffset?: number
}

type ScreenState = 'visible' | 'exit-up' | 'exit-down' | 'enter-down' | 'enter-up' | 'hidden'

function screenClass(state: ScreenState): string {
  const map: Record<ScreenState, string> = {
    'visible':    styles['mock-screen-visible'],
    'exit-up':    styles['mock-screen-exit-up'],
    'exit-down':  styles['mock-screen-exit-down'],
    'enter-down': styles['mock-screen-enter-down'],
    'enter-up':   styles['mock-screen-enter-up'],
    'hidden':     styles['mock-screen-hidden'],
  }
  return map[state]
}

export default function StickyShotTour({ steps, mockUrl = 'glyphic.cc/editor', stickyTopOffset = 40 }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [screenStates, setScreenStates] = useState<ScreenState[]>(
    steps.map((_, i) => (i === 0 ? 'visible' : 'hidden'))
  )
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const animatingRef = useRef(false)
  const activeRef = useRef(0)
  const pendingRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const transitionTo = useCallback((newIndex: number) => {
    if (newIndex === activeRef.current) return
    if (animatingRef.current) {
      pendingRef.current = newIndex
      return
    }
    animatingRef.current = true

    const oldIndex = activeRef.current
    activeRef.current = newIndex
    const goingDown = newIndex > oldIndex

    setActiveIndex(newIndex)

    // Park incoming screen off-screen, force flush, then animate both
    setScreenStates(prev => {
      const next = [...prev]
      next[newIndex] = goingDown ? 'enter-down' : 'enter-up'
      return next
    })

    // Double-rAF: first frame commits the enter position, second frame starts the transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setScreenStates(prev => {
          const next = [...prev]
          next[oldIndex] = goingDown ? 'exit-up' : 'exit-down'
          next[newIndex] = 'visible'
          return next
        })
        timerRef.current = setTimeout(() => {
          timerRef.current = null
          setScreenStates(prev => {
            const next = [...prev]
            next[oldIndex] = 'hidden'
            return next
          })
          animatingRef.current = false
          const pending = pendingRef.current
          pendingRef.current = null
          if (pending !== null && pending !== activeRef.current) {
            transitionTo(pending)
          }
        }, 450)
      })
    })
  }, [])

  // Cancel any in-flight transition timer on unmount
  useEffect(() => () => { if (timerRef.current !== null) clearTimeout(timerRef.current) }, [])

  // Scroll detection: find step whose midpoint is closest to viewport center
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const viewportMid = window.scrollY + window.innerHeight * 0.45
        let closest = 0
        let closestDist = Infinity
        stepRefs.current.forEach((el, i) => {
          if (!el) return
          const rect = el.getBoundingClientRect()
          const elMid = window.scrollY + rect.top + rect.height / 2
          const dist = Math.abs(elMid - viewportMid)
          if (dist < closestDist) {
            closestDist = dist
            closest = i
          }
        })
        transitionTo(closest)
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transitionTo])

  return (
    <div className={styles.tour}>
      {/* Left: sticky browser frame */}
      <div className={styles['sticky-col']} style={{ top: stickyTopOffset }}>
        <div className={styles['browser-frame']}>
          <div className={styles['browser-chrome']}>
            <div className={styles['browser-dots']}>
              <span className={styles['browser-dot']} style={{ background: '#ff5f57' }} />
              <span className={styles['browser-dot']} style={{ background: '#ffbd2e' }} />
              <span className={styles['browser-dot']} style={{ background: '#28c840' }} />
            </div>
            <span className={styles['browser-url']}>{mockUrl}</span>
          </div>
          <div className={styles['frame-progress']}>
            {steps.map((step, i) => (
              <button
                key={step.id}
                aria-label={`Feature ${i + 1}`}
                className={i === activeIndex ? styles['frame-dot-active'] : styles['frame-dot']}
                onClick={() => stepRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              />
            ))}
          </div>
          <div className={styles['mock-viewport']}>
            {steps.map((step, i) => (
              <div
                key={step.id}
                className={[styles['mock-screen'], screenClass(screenStates[i])].join(' ')}
                id={`sst-screen-${step.id}`}
              >
                {step.mock}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: scrolling copy */}
      <div className={styles['copy-col']}>
        {steps.map((step, i) => (
          <div
            key={step.id}
            ref={el => { stepRefs.current[i] = el }}
            data-active={i === activeIndex ? 'true' : 'false'}
            data-index={i}
            className={[
              styles['feature-step'],
              i === activeIndex ? styles['feature-step-active'] : styles['feature-step-dimmed'],
            ].join(' ')}
          >
            <span className={styles['feat-tag']}>{step.tag}</span>
            <h3 className={styles['feat-heading']}>{step.heading}</h3>
            <p className={styles['feat-subhead']}>{step.subhead}</p>
            <ul className={styles['feat-caps']}>
              {step.caps.map(cap => <li key={cap}>{cap}</li>)}
            </ul>
            <p className={styles['feat-tagline']}>{step.tagline}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
