import { parseSvgDoc } from './parseSvgDoc'
import { normalizeNodeId } from './parseMetaBlocks'
import type { StyleEntry } from './parseMetaBlocks'
import type { InjectorResult } from './injectFlowAnimations'
import { findNodeGroup, findClusterGroup, ensureDefs } from './svgShapeUtils'

const SVG_NS = 'http://www.w3.org/2000/svg'

interface ParsedGradient {
  angle: number
  stops: string[]
}

/**
 * Parse a CSS linear-gradient string into angle (degrees) and color stops.
 * Handles `linear-gradient(145deg, #abc, #def)` and `linear-gradient(#abc, #def)` (defaults to 180deg).
 * Each stop may optionally include a percentage offset which is stripped.
 */
function parseLinearGradient(value: string): ParsedGradient | null {
  const inner = value.match(/^linear-gradient\((.+)\)$/s)
  if (!inner) return null

  const content = inner[1].trim()
  const parts = content.split(',').map(p => p.trim())

  let angle = 180
  let stopStart = 0

  const firstPart = parts[0]
  const angleMatch = firstPart.match(/^(-?\d+(?:\.\d+)?)\s*deg$/i)
  if (angleMatch) {
    angle = parseFloat(angleMatch[1])
    stopStart = 1
  } else if (/^to\s+/i.test(firstPart)) {
    const dir = firstPart.toLowerCase().replace('to ', '').trim()
    const dirMap: Record<string, number> = {
      'top': 0, 'right': 90, 'bottom': 180, 'left': 270,
      'top right': 45, 'right top': 45, 'bottom right': 135, 'right bottom': 135,
      'bottom left': 225, 'left bottom': 225, 'top left': 315, 'left top': 315,
    }
    angle = dirMap[dir] ?? 180
    stopStart = 1
  }

  const rawStops = parts.slice(stopStart)
  const stops = rawStops.map(s => s.replace(/\s+[\d.]+%\s*$/, '').trim()).filter(Boolean)
  if (stops.length < 1) return null
  return { angle, stops }
}

/**
 * Map a CSS linear-gradient angle (degrees, clockwise from top) to SVG
 * linearGradient x1/y1/x2/y2 coordinates (in the gradient bounding box).
 *
 * CSS convention: 0deg = bottom-to-top, 90deg = left-to-right.
 * SVG: x1/y1 is the "from" (first stop) end, x2/y2 is the "to" end.
 */
function angleToSvgCoords(angle: number): { x1: number; y1: number; x2: number; y2: number } {
  const rad = (angle * Math.PI) / 180
  return {
    x1: parseFloat((0.5 - 0.5 * Math.sin(rad)).toFixed(6)),
    y1: parseFloat((0.5 + 0.5 * Math.cos(rad)).toFixed(6)),
    x2: parseFloat((0.5 + 0.5 * Math.sin(rad)).toFixed(6)),
    y2: parseFloat((0.5 - 0.5 * Math.cos(rad)).toFixed(6)),
  }
}

/**
 * Ensure a <style data-gf> element exists for gradient fill overrides.
 * Mermaid v11 applies fill via CSS class rules, which outrank fill attributes.
 * Using !important in a style block is the only reliable way to override.
 */
function ensureGfStyleEl(doc: Document): Element {
  let style = doc.documentElement.querySelector(':scope > style[data-gf]')
  if (!style) {
    style = doc.createElementNS(SVG_NS, 'style')
    style.setAttribute('data-gf', '1')
    doc.documentElement.appendChild(style)
  }
  return style
}

function appendFillRule(doc: Document, groupId: string, fillValue: string): void {
  const style = ensureGfStyleEl(doc)
  const s = `#${CSS.escape(groupId)}`
  const rule = `${s} > rect:not(.np-pulse), ${s} > path:not(.np-pulse), ${s} > circle:not(.np-pulse), ${s} > ellipse:not(.np-pulse), ${s} > polygon:not(.np-pulse), ${s} > g > rect:not(.np-pulse), ${s} > g > path:not(.np-pulse) { fill: ${fillValue} !important; }`
  style.textContent = (style.textContent ?? '') + rule
}

function appendClusterFillRule(doc: Document, groupId: string, fillValue: string): void {
  const style = ensureGfStyleEl(doc)
  // Target only the background rect — the direct rect child of the cluster g that isn't
  // an injected ghost. Using :first-child breaks when injectNodeGlow inserts a ghost rect
  // before the original, shifting :first-child off the real background rect.
  const rule = `#${CSS.escape(groupId)} > rect:not(.ng-ghost):not(.ng-inner-rim):not(.ng-fill-tint-overlay) { fill: ${fillValue} !important; }`
  style.textContent = (style.textContent ?? '') + rule
}

export function injectGradientFills(
  svg: string,
  entries: StyleEntry[],
): InjectorResult {
  const activeEntries = entries.filter(e => e.fill)
  if (activeEntries.length === 0) return { svg, unmatched: [] }

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

  for (const entry of activeEntries) {
    const nodeId = entry.nodeId
    if (!nodeId) continue

    const normalizedId = normalizeNodeId(nodeId)

    const rawNodeGroup = findNodeGroup(doc, normalizedId)
    const isCluster = rawNodeGroup === null
    const nodeGroup = rawNodeGroup ?? findClusterGroup(doc, normalizedId)

    if (!nodeGroup) {
      unmatched.push(nodeId)
      continue
    }

    const fillValue = entry.fill!
    const groupId = nodeGroup.getAttribute('id') ?? ''

    if (fillValue.startsWith('linear-gradient(')) {
      const parsed = parseLinearGradient(fillValue)
      if (!parsed) {
        unmatched.push(nodeId)
        continue
      }

      const { angle, stops } = parsed
      const gradId = `grad-${normalizedId}`
      const coords = angleToSvgCoords(angle)

      const defs = ensureDefs(doc)

      const existing = defs.querySelector(`#${CSS.escape(gradId)}`)
      if (existing) existing.remove()

      const linearGradient = doc.createElementNS(SVG_NS, 'linearGradient')
      linearGradient.setAttribute('id', gradId)
      linearGradient.setAttribute('x1', String(coords.x1))
      linearGradient.setAttribute('y1', String(coords.y1))
      linearGradient.setAttribute('x2', String(coords.x2))
      linearGradient.setAttribute('y2', String(coords.y2))
      linearGradient.setAttribute('gradientUnits', 'objectBoundingBox')

      stops.forEach((color, idx) => {
        const stop = doc.createElementNS(SVG_NS, 'stop')
        const offset = stops.length === 1 ? 0 : idx / (stops.length - 1)
        stop.setAttribute('offset', `${Math.round(offset * 100)}%`)
        stop.setAttribute('stop-color', color)
        linearGradient.appendChild(stop)
      })

      defs.appendChild(linearGradient)

      if (isCluster) {
        appendClusterFillRule(doc, groupId, `url(#${gradId})`)
      } else {
        appendFillRule(doc, groupId, `url(#${gradId})`)
      }
      injected = true
    } else {
      if (isCluster) {
        appendClusterFillRule(doc, groupId, fillValue)
      } else {
        appendFillRule(doc, groupId, fillValue)
      }
      injected = true
    }
  }

  if (!injected && unmatched.length === 0) return { svg, unmatched }

  const serialized = injected ? new XMLSerializer().serializeToString(doc) : svg
  return { svg: injected ? serialized : svg, unmatched }
}
