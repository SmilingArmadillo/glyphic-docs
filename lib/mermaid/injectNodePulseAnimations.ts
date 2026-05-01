import { parseSvgDoc } from './parseSvgDoc'
// Pure string-only utility — no DOM APIs (document, window, DOMParser, XMLSerializer).
// Must be importable and runnable in Node.js without a browser shim.
// NOTE: This file uses DOMParser/XMLSerializer — these are available in jsdom (test env) and browser.

import { normalizeNodeId } from './parseMetaBlocks'
import type { AnimateEntry } from './parseMetaBlocks'
import type { InjectorResult } from './injectFlowAnimations'
import { findNodeGroup, ensureDefs, isInjected } from './svgShapeUtils'

const SVG_NS = 'http://www.w3.org/2000/svg'

const SHAPE_TAGS = new Set(['rect', 'circle', 'polygon', 'ellipse'])

/**
 * Find the first shape child of a node <g>, skipping any elements already
 * injected by our own pipeline (ng-ghost, np-ripple, etc.).
 * First checks for rect/circle/polygon/ellipse (old renderer).
 * Falls back to the largest <path> outside g.label (Mermaid v11 path-based nodes).
 */
function findShapeChild(nodeGroup: Element): Element | null {
  // Direct children first
  const directShape = Array.from(nodeGroup.children).find(child =>
    SHAPE_TAGS.has(child.tagName.toLowerCase()) && !isInjected(child)
  )
  if (directShape) return directShape

  // One level deeper into nested <g>
  for (const child of Array.from(nodeGroup.children)) {
    if (child.tagName.toLowerCase() === 'g' && !isInjected(child)) {
      const nested = Array.from(child.children).find(c =>
        SHAPE_TAGS.has(c.tagName.toLowerCase()) && !isInjected(c)
      )
      if (nested) return nested
    }
  }

  // Mermaid v11: path-based nodes — pick the largest path outside g.label
  const labelGroup = nodeGroup.querySelector('g.label')
  const allPaths = Array.from(nodeGroup.querySelectorAll('path[d]'))
  let bestPath: Element | null = null
  let bestArea = 0
  for (const path of allPaths) {
    if (isInjected(path)) continue
    if (labelGroup && labelGroup.contains(path)) continue
    const d = path.getAttribute('d') ?? ''
    const nums = (d.match(/-?[\d.]+(?:e[-+]?\d+)?/gi) ?? []).map(Number).filter(n => !isNaN(n))
    if (nums.length < 4) continue
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (let i = 0; i + 1 < nums.length; i += 2) {
      if (nums[i] < minX) minX = nums[i]
      if (nums[i] > maxX) maxX = nums[i]
      if (nums[i + 1] < minY) minY = nums[i + 1]
      if (nums[i + 1] > maxY) maxY = nums[i + 1]
    }
    const area = (maxX - minX) * (maxY - minY)
    if (area > bestArea) { bestArea = area; bestPath = path }
  }
  return bestPath
}

/**
 * Ensure a <style> element exists as a direct child of the SVG root for injecting CSS keyframes.
 * Placed outside <defs> so that browsers apply the styles when SVG is inserted via innerHTML.
 */
function ensureStyleEl(doc: Document): Element {
  let style = doc.documentElement.querySelector(':scope > style[data-np]')
  if (!style) {
    style = doc.createElementNS(SVG_NS, 'style')
    style.setAttribute('data-np', '1')
    // Insert after <defs> if present, otherwise prepend
    const defs = doc.documentElement.querySelector('defs')
    if (defs && defs.nextSibling) {
      doc.documentElement.insertBefore(style, defs.nextSibling)
    } else {
      doc.documentElement.appendChild(style)
    }
  }
  return style
}

/**
 * Append a CSS @keyframes rule to the SVG <style> block, keyed by animName.
 * No-ops if that animName already exists.
 */
function ensureKeyframes(doc: Document, animName: string, keyframesBody: string): void {
  const style = ensureStyleEl(doc)
  const existing = style.textContent ?? ''
  if (existing.includes(animName)) return
  style.textContent = existing + `@keyframes ${animName}{${keyframesBody}}`
}

/**
 * Per-style intensity lookup tables.
 * Each table maps intensity=low|medium|high to a concrete parameter value.
 * medium always matches the previous default so omitting intensity is a no-op.
 */
const BORDER_STROKE_DELTA = { low: 1, medium: 2, high: 4 } as const
const BORDER_PEAK_OPACITY  = { low: 0.5, medium: 0.8, high: 1.0 } as const
const FILL_MIN_OPACITY     = { low: 0.6, medium: 0.4, high: 0.2 } as const
const FLASH_STROKE_DELTA   = { low: 1, medium: 2, high: 4 } as const
const RIPPLE_END_DELTA     = { low: 40, medium: 65, high: 90 } as const
const SHADOW_STD_DEVIATION = { low: 2, medium: 4, high: 8 } as const

/**
 * Inject or reuse a feGaussianBlur glow filter for node-pulse shadow/flash styles.
 * Filter ID format: np-glow-{normalizedNodeId}
 * The stdDeviation is set on creation; reuse returns the existing filter ID unchanged.
 * Returns the filter ID.
 */
function ensureGlowFilter(doc: Document, normalizedId: string, stdDeviation: number): string {
  const filterId = `np-glow-${normalizedId}`

  // Reuse if already present
  if (doc.getElementById(filterId)) return filterId

  const defs = ensureDefs(doc)

  const filter = doc.createElementNS(SVG_NS, 'filter')
  filter.setAttribute('id', filterId)
  filter.setAttribute('x', '-50%')
  filter.setAttribute('y', '-50%')
  filter.setAttribute('width', '200%')
  filter.setAttribute('height', '200%')

  // Raw blur only — the original shape is already visible; this layer adds glow on top.
  const blur = doc.createElementNS(SVG_NS, 'feGaussianBlur')
  blur.setAttribute('stdDeviation', String(stdDeviation))

  filter.appendChild(blur)
  defs.appendChild(filter)

  return filterId
}

/** Extract {cx, cy} bounding-box center from a path `d` attribute. */
function pathCenter(d: string): { cx: number; cy: number } | null {
  const nums = (d.match(/-?[\d.]+(?:e[-+]?\d+)?/gi) ?? []).map(Number).filter(n => !isNaN(n))
  if (nums.length < 4) return null
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (let i = 0; i + 1 < nums.length; i += 2) {
    if (nums[i] < minX) minX = nums[i]
    if (nums[i] > maxX) maxX = nums[i]
    if (nums[i + 1] < minY) minY = nums[i + 1]
    if (nums[i + 1] > maxY) maxY = nums[i + 1]
  }
  return isFinite(minX) ? { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 } : null
}

/**
 * Clone the relevant attributes from a shape element to create a pulse overlay.
 * For path elements (Mermaid v11), clones the path directly (no inset — paths
 * can't be shrunk analytically; callers use scale-based animation instead).
 * The inset parameter shrinks each side by that amount (use strokeWidth/2 so the
 * stroke stays within the SVG viewport rather than being clipped at the boundary).
 */
function cloneShapeGeometry(doc: Document, shapeEl: Element, inset = 0): Element {
  const tag = shapeEl.tagName.toLowerCase()

  if (tag === 'path') {
    // Clone the path directly so the pulse ring matches the actual node shape.
    // Inset is not applied to paths (no reliable way to shrink an arbitrary path).
    const clone = doc.createElementNS(SVG_NS, 'path')
    const d = shapeEl.getAttribute('d')
    if (d) clone.setAttribute('d', d)
    return clone
  }

  const clone = doc.createElementNS(SVG_NS, tag)

  if (tag === 'rect') {
    const x = parseFloat(shapeEl.getAttribute('x') ?? '0')
    const y = parseFloat(shapeEl.getAttribute('y') ?? '0')
    const w = parseFloat(shapeEl.getAttribute('width') ?? '0')
    const h = parseFloat(shapeEl.getAttribute('height') ?? '0')
    clone.setAttribute('x', String(x + inset))
    clone.setAttribute('y', String(y + inset))
    clone.setAttribute('width', String(Math.max(0, w - inset * 2)))
    clone.setAttribute('height', String(Math.max(0, h - inset * 2)))
    for (const attr of ['rx', 'ry']) {
      const val = shapeEl.getAttribute(attr)
      if (val !== null) clone.setAttribute(attr, val)
    }
  } else if (tag === 'circle') {
    const r = parseFloat(shapeEl.getAttribute('r') ?? '0')
    clone.setAttribute('cx', shapeEl.getAttribute('cx') ?? '0')
    clone.setAttribute('cy', shapeEl.getAttribute('cy') ?? '0')
    clone.setAttribute('r', String(r - inset))
  } else if (tag === 'ellipse') {
    const rx = parseFloat(shapeEl.getAttribute('rx') ?? '0')
    const ry = parseFloat(shapeEl.getAttribute('ry') ?? '0')
    clone.setAttribute('cx', shapeEl.getAttribute('cx') ?? '0')
    clone.setAttribute('cy', shapeEl.getAttribute('cy') ?? '0')
    clone.setAttribute('rx', String(rx - inset))
    clone.setAttribute('ry', String(ry - inset))
  } else if (tag === 'polygon') {
    const points = shapeEl.getAttribute('points')
    if (points !== null) clone.setAttribute('points', points)
  }

  return clone
}

/**
 * Inject pulsing node animations for @animate node-pulse entries.
 *
 * Returns { svg, unmatched } — same pattern as all other injectors.
 * Only processes entries where kind==='node' && type==='node-pulse'.
 *
 * Uses CSS @keyframes animations (not SMIL) so that animations run correctly
 * when the SVG is inserted via innerHTML into the DOM.
 */
export function injectNodePulseAnimations(
  svg: string,
  entries: AnimateEntry[],
): InjectorResult {
  // Filter to only node-pulse entries
  const nodePulseEntries = entries.filter(e => e.kind === 'node' && e.type === 'node-pulse')
  if (nodePulseEntries.length === 0) return { svg, unmatched: [] }

  let doc: Document
  try {
    const parsed = parseSvgDoc(svg)
    if (!parsed) return { svg, unmatched: [] }
    doc = parsed
  } catch {
    return { svg, unmatched: [] }
  }

  const unmatched: string[] = []
  let injected = false

  for (const entry of nodePulseEntries) {
    const nodeId = entry.nodeId ?? ''
    if (!nodeId) continue

    const normalizedId = normalizeNodeId(nodeId)
    const nodeGroup = findNodeGroup(doc, normalizedId)

    if (!nodeGroup) {
      unmatched.push(nodeId)
      continue
    }

    const shapeEl = findShapeChild(nodeGroup)
    if (!shapeEl) {
      unmatched.push(nodeId)
      continue
    }

    // Skip if this node group already has an injected pulse — prevents double-injection
    // when the pipeline runs multiple passes on the same SVG.
    if (nodeGroup.querySelector('.np-pulse, .np-ripple')) continue

    const color = entry.color ?? '#3b82f6'
    const speed = entry.speed ?? 1.5
    const dur = `${speed}s`
    const pulseStyle = entry.pulseStyle ?? 'border'
    const intensity = entry.intensity ?? 'medium'

    if (pulseStyle === 'fill') {
      // CSS keyframes: fill-opacity 1 → minFillOpacity → 1
      // intensity controls the minimum opacity (darker dip for high, subtler for low)
      const minFillOpacity = FILL_MIN_OPACITY[intensity]
      const animName = `np-fill-${normalizedId}`
      ensureKeyframes(doc, animName,
        `0%{fill-opacity:1}50%{fill-opacity:${minFillOpacity}}100%{fill-opacity:1}`
      )
      const existing = shapeEl.getAttribute('style') ?? ''
      shapeEl.setAttribute('style',
        `${existing};animation:${animName} ${dur} ease-in-out infinite`
      )
      injected = true
    } else if (pulseStyle === 'fill-flash') {
      // Breathe the node fill + outer glow, matching the reference flash-amber animation:
      // - fill overlay pulses from transparent → color (saturated peak) → transparent
      // - a blurred ghost shape pulses simultaneously for the outer glow/shadow bleed
      // intensity controls peak opacity: low=0.6, medium=0.8, high=1.0
      // glow blur radius: low=8, medium=14, high=20
      const peakOpacity  = intensity === 'high' ? 1.0 : intensity === 'low' ? 0.6 : 0.8
      const glowOpacity  = intensity === 'high' ? 0.9 : intensity === 'low' ? 0.5 : 0.7
      const glowBlur     = intensity === 'high' ? 32 : intensity === 'low' ? 12 : 20
      const animName     = `np-fill-flash-${normalizedId}`
      const glowAnimName = `np-fill-flash-glow-${normalizedId}`
      const glowFilterId = `np-ff-glow-${normalizedId}`

      ensureKeyframes(doc, animName,
        `0%,100%{opacity:0}50%{opacity:${peakOpacity}}`
      )
      ensureKeyframes(doc, glowAnimName,
        `0%,100%{opacity:0}50%{opacity:${glowOpacity}}`
      )

      // Outer glow: blurred ghost shape, no inset, inserted before the shape so it renders behind
      const defs = ensureDefs(doc)
      if (!doc.getElementById(glowFilterId)) {
        const filter = doc.createElementNS(SVG_NS, 'filter')
        filter.setAttribute('id', glowFilterId)
        filter.setAttribute('x', '-50%')
        filter.setAttribute('y', '-50%')
        filter.setAttribute('width', '200%')
        filter.setAttribute('height', '200%')
        const blur = doc.createElementNS(SVG_NS, 'feGaussianBlur')
        blur.setAttribute('stdDeviation', String(glowBlur))
        filter.appendChild(blur)
        defs.appendChild(filter)
      }
      const glow = cloneShapeGeometry(doc, shapeEl, 0)
      glow.setAttribute('fill', color)
      glow.setAttribute('stroke', 'none')
      glow.setAttribute('filter', `url(#${glowFilterId})`)
      glow.setAttribute('class', 'np-pulse')
      glow.setAttribute('style',
        `fill:${color} !important;stroke:none !important;pointer-events:none;animation:${glowAnimName} ${dur} ease-in-out infinite`
      )
      shapeEl.parentNode?.insertBefore(glow, shapeEl)

      // Fill overlay: inset by half stroke-width so fill stays inside the border
      const strokeWidth = parseFloat(shapeEl.getAttribute('stroke-width') ?? '2')
      const overlay = cloneShapeGeometry(doc, shapeEl, strokeWidth / 2)
      overlay.setAttribute('fill', color)
      overlay.setAttribute('stroke', 'none')
      overlay.setAttribute('class', 'np-pulse')
      overlay.setAttribute('style',
        `fill:${color} !important;stroke:none !important;pointer-events:none;animation:${animName} ${dur} ease-in-out infinite`
      )
      shapeEl.parentNode?.insertBefore(overlay, shapeEl.nextSibling)
      injected = true
    } else if (pulseStyle === 'flash') {
      // Hard strobe: visible for first half, invisible for second half.
      // Uses adjacent keyframe stops to create a hard edge without relying on
      // step-end (which browsers map to steps(1) and collapse to one state).
      // intensity controls stroke-width delta; high also adds a glow filter.
      const animName = `np-flash-${normalizedId}`
      ensureKeyframes(doc, animName,
        `0%{opacity:1}49%{opacity:1}50%{opacity:0}99%{opacity:0}100%{opacity:1}`
      )
      const origStrokeWidth = parseFloat(shapeEl.getAttribute('stroke-width') ?? '2')
      const strokeDelta = FLASH_STROKE_DELTA[intensity]
      const pulseStrokeWidth = origStrokeWidth + strokeDelta
      // Inset by half stroke so the pulse stays within the SVG viewport (overflow:hidden)
      const pulseShape = cloneShapeGeometry(doc, shapeEl, pulseStrokeWidth / 2)
      pulseShape.setAttribute('fill', 'none')
      pulseShape.setAttribute('stroke', color)
      pulseShape.setAttribute('stroke-width', String(pulseStrokeWidth))
      pulseShape.setAttribute('class', 'np-pulse')
      pulseShape.setAttribute('style', `fill:none !important;stroke:${color} !important;stroke-width:${pulseStrokeWidth}px !important;animation:${animName} ${dur} linear infinite`)
      if (intensity === 'high') {
        const filterId = ensureGlowFilter(doc, normalizedId, 4)
        pulseShape.setAttribute('filter', `url(#${filterId})`)
      }
      shapeEl.parentNode?.insertBefore(pulseShape, shapeEl.nextSibling)
      injected = true
    } else if (pulseStyle === 'ripple') {
      const startStroke = 1.5
      const count = entry.rippleCount ?? 1
      const offset = speed / count

      if (count > 0) {
        const tag = shapeEl.tagName.toLowerCase()

        // Compute the center point for scale-based animation (works for rect, circle, ellipse, path).
        // All ripple rings animate scale(1)→scale(endScale) from this center so they expand
        // outward from the node boundary rather than sitting inset as a static inner border.
        let cx = 0, cy = 0
        if (tag === 'rect') {
          cx = parseFloat(shapeEl.getAttribute('x') ?? '0') + parseFloat(shapeEl.getAttribute('width') ?? '0') / 2
          cy = parseFloat(shapeEl.getAttribute('y') ?? '0') + parseFloat(shapeEl.getAttribute('height') ?? '0') / 2
        } else if (tag === 'circle' || tag === 'ellipse') {
          cx = parseFloat(shapeEl.getAttribute('cx') ?? '0')
          cy = parseFloat(shapeEl.getAttribute('cy') ?? '0')
        } else if (tag === 'path') {
          const c = pathCenter(shapeEl.getAttribute('d') ?? '')
          if (c) { cx = c.cx; cy = c.cy }
        }

        const endScale = parseFloat((1 + RIPPLE_END_DELTA[intensity] / 100).toFixed(4))

        for (let i = 0; i < count; i++) {
          const animName = `np-ripple-${normalizedId}-${i}`
          const delay = i > 0 ? `${parseFloat((i * offset).toFixed(3))}s` : '0s'

          ensureKeyframes(doc, animName,
            `0%{transform:scale(1);opacity:0.5}100%{transform:scale(${endScale});opacity:0}`
          )
          const ring = cloneShapeGeometry(doc, shapeEl, 0)
          ring.setAttribute('fill', 'none')
          ring.setAttribute('stroke', color)
          ring.setAttribute('stroke-width', String(startStroke))
          ring.setAttribute('class', 'np-ripple')
          // Use !important in style to beat Mermaid's CSS class rules targeting rect/path
          ring.setAttribute('style', `fill:none !important;stroke:${color} !important;stroke-width:${startStroke}px !important`)
          const wrapper = doc.createElementNS(SVG_NS, 'g')
          wrapper.setAttribute('style',
            `transform-origin:${cx}px ${cy}px;animation:${animName} ${dur} ease-out ${delay} infinite`
          )
          wrapper.appendChild(ring)
          shapeEl.parentNode?.insertBefore(wrapper, shapeEl.nextSibling)
        }
        injected = true
      }
    } else {
      // border or shadow: overlay shape, opacity 0 → peakOpacity → 0
      // intensity controls stroke-width delta and peak opacity
      const peakOpacity = BORDER_PEAK_OPACITY[intensity]
      const strokeDelta = BORDER_STROKE_DELTA[intensity]
      const animName = `np-border-${normalizedId}`
      ensureKeyframes(doc, animName,
        `0%,100%{opacity:0}50%{opacity:${peakOpacity}}`
      )
      const origStrokeWidth = parseFloat(shapeEl.getAttribute('stroke-width') ?? '2')
      const pulseStrokeWidth = origStrokeWidth + strokeDelta
      const pulseShape = cloneShapeGeometry(doc, shapeEl, pulseStrokeWidth / 2)
      pulseShape.setAttribute('fill', 'none')
      pulseShape.setAttribute('stroke', color)
      pulseShape.setAttribute('stroke-width', String(pulseStrokeWidth))
      pulseShape.setAttribute('class', 'np-pulse')
      pulseShape.setAttribute('style', `fill:none !important;stroke:${color} !important;stroke-width:${pulseStrokeWidth}px !important;animation:${animName} ${dur} ease-in-out infinite`)

      if (pulseStyle === 'shadow') {
        const stdDeviation = SHADOW_STD_DEVIATION[intensity]
        const filterId = ensureGlowFilter(doc, normalizedId, stdDeviation)
        pulseShape.setAttribute('filter', `url(#${filterId})`)
      }

      shapeEl.parentNode?.insertBefore(pulseShape, shapeEl.nextSibling)
      injected = true
    }
  }

  if (!injected && unmatched.length === 0) return { svg, unmatched }

  const serialized = injected ? new XMLSerializer().serializeToString(doc) : svg
  return { svg: injected ? serialized : svg, unmatched }
}
