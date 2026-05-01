'use client'

// src/components/GlyphField/RippleField.tsx
import { useEffect, useRef, type RefObject } from 'react'
import { GLYPHS, buildGlyphSvg } from './glyphs'
import './RippleField.css'

interface RippleFieldProps {
  count?: number
  minDistance?: number
  margin?: number
  exclude?: RefObject<HTMLElement | null>
  excludePadding?: number
  accentColor?: string
  inkColor?: string
  className?: string
}

interface Floater {
  el: HTMLDivElement
  hx: number
  hy: number
  x: number
  y: number
  tx: number
  ty: number
  r: number
  tr: number
  s: number
  ts: number
  o: number
  to: number
  phase: number
}

export default function RippleField({
  count = 36,
  minDistance = 80,
  margin = 40,
  exclude = undefined,
  excludePadding = 50,
  accentColor = '#5850EC',
  inkColor,
  className = '',
}: RippleFieldProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000, active: false })

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    function generateLayout(): Array<{ x: number; y: number }> {
      const rect = stage!.getBoundingClientRect()
      let exZ: { x: number; y: number; w: number; h: number } | null = null
      if (exclude?.current) {
        const ex = exclude.current.getBoundingClientRect()
        exZ = {
          x: ex.left - rect.left - excludePadding,
          y: ex.top - rect.top - excludePadding,
          w: ex.width + excludePadding * 2,
          h: ex.height + excludePadding * 2,
        }
      }
      const placed: Array<{ x: number; y: number }> = []
      let attempts = 0
      const maxAttempts = count * 40
      while (placed.length < count && attempts < maxAttempts) {
        attempts++
        const x = margin + Math.random() * (rect.width - margin * 2)
        const y = margin + Math.random() * (rect.height - margin * 2)
        if (
          exZ &&
          x > exZ.x && x < exZ.x + exZ.w &&
          y > exZ.y && y < exZ.y + exZ.h
        ) continue
        let tooClose = false
        for (const p of placed) {
          const dx = p.x - x
          const dy = p.y - y
          if (dx * dx + dy * dy < minDistance * minDistance) {
            tooClose = true
            break
          }
        }
        if (!tooClose) placed.push({ x, y })
      }
      return placed
    }

    let floaters: Floater[] = []
    let stageRect: DOMRect

    function buildFloaters() {
      stage!.innerHTML = ''
      const layout = generateLayout()
      floaters = layout.map((pos, i) => {
        const g = GLYPHS[i % GLYPHS.length]
        const el = document.createElement('div')
        el.className = 'rf-floater'
        el.style.left = pos.x + 'px'
        el.style.top = pos.y + 'px'
        el.innerHTML = buildGlyphSvg(g, 44)
        stage!.appendChild(el)
        return {
          el,
          hx: pos.x, hy: pos.y,
          x: pos.x, y: pos.y,
          tx: pos.x, ty: pos.y,
          r: 0, tr: 0,
          s: 1, ts: 1,
          o: 0.3, to: 0.3,
          phase: Math.random() * Math.PI * 2,
        }
      })
    }
    buildFloaters()
    stageRect = stage.getBoundingClientRect()

    function onMove(e: MouseEvent) {
      mouseRef.current.x = e.clientX - stageRect.left
      mouseRef.current.y = e.clientY - stageRect.top
      mouseRef.current.active = true
    }
    function onLeave() {
      mouseRef.current.x = -1000
      mouseRef.current.y = -1000
      mouseRef.current.active = false
    }
    stage.addEventListener('mousemove', onMove)
    stage.addEventListener('mouseleave', onLeave)

    const INFLUENCE_RADIUS = 400
    let raf = 0

    function tick(t: number) {
      const { x: mx, y: my, active } = mouseRef.current
      for (const p of floaters) {
        const ringPhase = (t * 0.003 + p.phase) % (Math.PI * 2)
        const ring = Math.sin(ringPhase) * 0.5 + 0.5

        if (active) {
          const dx = mx - p.hx
          const dy = my - p.hy
          const dist = Math.hypot(dx, dy)
          if (dist < INFLUENCE_RADIUS) {
            const near = 1 - dist / INFLUENCE_RADIUS
            const boost = near * near
            p.ts = 1 + boost * 0.9
            p.to = 0.3 + boost * 0.7 + ring * 0.1
            p.tr = Math.sin(t * 0.002 + p.phase) * 8 * near
            const pull = boost * 15
            const unit = Math.max(dist, 1)
            p.tx = p.hx + (dx / unit) * pull
            p.ty = p.hy + (dy / unit) * pull
          } else {
            p.ts = 1
            p.to = 0.3 + ring * 0.15
            p.tr = 0
            p.tx = p.hx
            p.ty = p.hy
          }
        } else {
          p.ts = 1
          p.to = 0.3 + ring * 0.15
          p.tr = 0
          p.tx = p.hx
          p.ty = p.hy
        }

        p.x += (p.tx - p.x) * 0.12
        p.y += (p.ty - p.y) * 0.12
        p.r += (p.tr - p.r) * 0.15
        p.s += (p.ts - p.s) * 0.14
        p.o += (p.to - p.o) * 0.1

        p.el.style.transform =
          `translate(${p.x - p.hx}px, ${p.y - p.hy}px) ` +
          `rotate(${p.r}deg) scale(${p.s})`
        p.el.style.opacity = String(p.o)
        if (p.o > 0.65) {
          p.el.style.color = accentColor
        } else {
          p.el.style.color = inkColor ?? 'var(--ripple-ink, currentColor)'
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    let resizeTimer = 0
    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        buildFloaters()
        stageRect = stage!.getBoundingClientRect()
      }, 200)
    }
    window.addEventListener('resize', onResize)
    const ro = new ResizeObserver(onResize)
    ro.observe(stage)

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    function applyReducedMotion() {
      if (mq.matches) {
        cancelAnimationFrame(raf)
        raf = 0
        for (const p of floaters) {
          p.el.style.transform = ''
          p.el.style.opacity = '0.3'
          p.el.style.color = inkColor ?? 'var(--ripple-ink, currentColor)'
        }
      } else if (!raf) {
        raf = requestAnimationFrame(tick)
      }
    }
    applyReducedMotion()
    mq.addEventListener('change', applyReducedMotion)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      ro.disconnect()
      stage.removeEventListener('mousemove', onMove)
      stage.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', onResize)
      mq.removeEventListener('change', applyReducedMotion)
      stage.innerHTML = ''
    }
  }, [count, minDistance, margin, excludePadding, accentColor, inkColor, exclude])

  return (
    <div
      ref={stageRef}
      className={`ripple-field ${className}`}
      aria-hidden="true"
    />
  )
}
