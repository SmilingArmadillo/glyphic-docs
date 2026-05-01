import { parseSvgDoc } from './parseSvgDoc'
import { normalizeNodeId } from './parseMetaBlocks'
import type { AnimateEntry, BadgeEntry } from './parseMetaBlocks'
import type { InjectorResult } from './injectFlowAnimations'

const SVG_NS = 'http://www.w3.org/2000/svg'

function edgeKeyFromPathId(id: string): string | null {
  const match = id.match(/L_(.+)_(.+)_(\d+)$/)
  if (!match) return null
  return `${normalizeNodeId(match[1])}-->${normalizeNodeId(match[2])}`
}

const MIN_GAP_FRACTION = 0.15
const MIN_GAP_FLOOR_PX = 8
const BADGE_HEIGHT_PX = 22 // matches BADGE_HEIGHT in injectNodeBadges.ts

function computePathSegments(d: string): { points: [number, number][]; segLengths: number[]; totalLen: number } {
  const nums = (d.match(/-?[\d.]+(?:e[-+]?\d+)?/gi) ?? []).map(Number).filter(n => !isNaN(n))
  const points: [number, number][] = []
  for (let i = 0; i + 1 < nums.length; i += 2) {
    points.push([nums[i], nums[i + 1]])
  }
  const segLengths: number[] = []
  let totalLen = 0
  for (let i = 0; i + 1 < points.length; i++) {
    const dx = points[i + 1][0] - points[i][0]
    const dy = points[i + 1][1] - points[i][1]
    const len = Math.sqrt(dx * dx + dy * dy)
    segLengths.push(len)
    totalLen += len
  }
  return { points, segLengths, totalLen }
}

function getPlacementPoint(
  segments: { points: [number, number][]; segLengths: number[]; totalLen: number },
  startExclusion: number,
  endExclusion: number,
  midpointBias: number,
): { x: number; y: number } {
  const { points, segLengths, totalLen } = segments

  if (points.length < 2) {
    return { x: points[0]?.[0] ?? 0, y: points[0]?.[1] ?? 0 }
  }

  if (totalLen === 0) return { x: points[0][0], y: points[0][1] }

  // Asymmetric safe zone — each end can be expanded independently by badge presence
  const safeStart = startExclusion
  const safeEnd = totalLen - endExclusion

  let target: number
  if (safeEnd <= safeStart) {
    // Edge too short to satisfy exclusion zones — badge bias is also discarded because there is no safe range to bias within
    target = totalLen * 0.5
  } else {
    const biased = totalLen * 0.5 + midpointBias
    if (biased >= safeStart && biased <= safeEnd) {
      target = biased
    } else {
      // Biased midpoint falls outside safe range — use midpoint of safe zone
      target = (safeStart + safeEnd) / 2
    }
  }

  // Walk segments to find the point at `target` distance
  let accumulated = 0
  for (let i = 0; i < segLengths.length; i++) {
    const segLen = segLengths[i]
    if (accumulated + segLen >= target) {
      const t = segLen === 0 ? 0 : (target - accumulated) / segLen
      const x = points[i][0] + t * (points[i + 1][0] - points[i][0])
      const y = points[i][1] + t * (points[i + 1][1] - points[i][1])
      return { x, y }
    }
    accumulated += segLen
  }

  // Fallback: last point
  return { x: points[points.length - 1][0], y: points[points.length - 1][1] }
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16)
    const g = parseInt(h[1] + h[1], 16)
    const b = parseInt(h[2] + h[2], 16)
    return `rgba(${r},${g},${b},${alpha})`
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }
  return `rgba(200,200,200,${alpha})`
}

export function injectEdgeLabels(
  svg: string,
  entries: AnimateEntry[],
  badgeEntries: BadgeEntry[] = [],
): InjectorResult {
  const labelEntries = entries.filter(
    e => e.kind === 'edge' && e.edgeLabel && e.from && e.to,
  )
  if (labelEntries.length === 0) return { svg, unmatched: [] }

  let doc: Document
  try {
    const parsed = parseSvgDoc(svg)
    if (!parsed) return { svg, unmatched: [] }
    doc = parsed
  } catch {
    return { svg, unmatched: [] }
  }

  const paths = Array.from(doc.querySelectorAll('path.flowchart-link'))
  const pathByKey = new Map<string, Element>()
  for (const path of paths) {
    const id = path.getAttribute('id')
    if (!id) continue
    const key = edgeKeyFromPathId(id)
    if (key && !pathByKey.has(key)) pathByKey.set(key, path)
  }

  const unmatched: string[] = []
  let injected = false

  for (const entry of labelEntries) {
    const key = `${normalizeNodeId(entry.from!)}-->${normalizeNodeId(entry.to!)}`
    const path = pathByKey.get(key)
    if (!path) {
      unmatched.push(key)
      continue
    }

    const d = path.getAttribute('d') ?? ''
    if (!d) {
      unmatched.push(key)
      continue
    }
    const fromId = normalizeNodeId(entry.from!)
    const toId = normalizeNodeId(entry.to!)

    const segments = computePathSegments(d)
    const baseExclusion = Math.max(segments.totalLen * MIN_GAP_FRACTION, MIN_GAP_FLOOR_PX)

    // Detect edge orientation from path geometry (TB vs LR)
    // Compare absolute delta x vs delta y between first and last points
    const first = segments.points[0]
    const last = segments.points[segments.points.length - 1]
    const isHorizontal = first != null && last != null
      ? Math.abs(last[0] - first[0]) > Math.abs(last[1] - first[1])
      : false

    const hasSourceBottomBadge = badgeEntries.some(b => normalizeNodeId(b.nodeId) === fromId && b.direction === 'bottom')
    const hasDestTopBadge = badgeEntries.some(b => normalizeNodeId(b.nodeId) === toId && b.direction === 'top')
    const hasSourceRightBadge = badgeEntries.some(b => normalizeNodeId(b.nodeId) === fromId && b.direction === 'right')
    const hasDestLeftBadge = badgeEntries.some(b => normalizeNodeId(b.nodeId) === toId && b.direction === 'left')
    // For TB (vertical) edges, only bottom/top badges matter; for LR (horizontal) edges, only right/left badges matter
    const sourceHasBadge = isHorizontal ? hasSourceRightBadge : hasSourceBottomBadge
    const destHasBadge = isHorizontal ? hasDestLeftBadge : hasDestTopBadge
    const startExclusion = sourceHasBadge ? baseExclusion + BADGE_HEIGHT_PX : baseExclusion
    const endExclusion = destHasBadge ? baseExclusion + BADGE_HEIGHT_PX : baseExclusion
    const midpointBias = (sourceHasBadge ? BADGE_HEIGHT_PX : 0) - (destHasBadge ? BADGE_HEIGHT_PX : 0)
    const pt = getPlacementPoint(segments, startExclusion, endExclusion, midpointBias)

    const color = entry.color ?? '#3b82f6'
    const bgColor = hexToRgba(color, 0.2)
    const labelText = entry.edgeLabel!

    const PADDING_X = 6
    const PADDING_Y = 3
    const FONT_SIZE = 11
    const approxTextWidth = labelText.length * FONT_SIZE * 0.55
    const rectW = approxTextWidth + PADDING_X * 2
    const rectH = FONT_SIZE + PADDING_Y * 2

    const g = doc.createElementNS(SVG_NS, 'g')
    g.setAttribute('class', 'ea-label')

    const rect = doc.createElementNS(SVG_NS, 'rect')
    rect.setAttribute('width', String(rectW))
    rect.setAttribute('height', String(rectH))
    rect.setAttribute('rx', '4')
    rect.setAttribute('fill', bgColor)
    rect.setAttribute('stroke', color)
    rect.setAttribute('stroke-width', '1')
    rect.setAttribute('stroke-opacity', '0.6')
    rect.setAttribute('x', String(pt.x - rectW / 2))
    rect.setAttribute('y', String(pt.y - rectH / 2))

    const text = doc.createElementNS(SVG_NS, 'text')
    text.setAttribute('x', String(pt.x))
    text.setAttribute('y', String(pt.y))
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('dominant-baseline', 'middle')
    text.setAttribute('fill', color)
    text.setAttribute('font-size', String(FONT_SIZE))
    text.setAttribute('font-family', 'sans-serif')
    text.setAttribute('font-weight', '500')
    text.textContent = labelText

    g.appendChild(rect)
    g.appendChild(text)

    path.parentNode?.insertBefore(g, path.nextSibling)
    injected = true
  }

  if (!injected && unmatched.length === 0) return { svg, unmatched }
  return { svg: injected ? new XMLSerializer().serializeToString(doc) : svg, unmatched }
}
