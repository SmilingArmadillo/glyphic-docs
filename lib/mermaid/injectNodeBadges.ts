import { parseSvgDoc } from './parseSvgDoc'
import { normalizeNodeId } from './parseMetaBlocks'
import type { BadgeEntry } from './parseMetaBlocks'
import type { InjectorResult } from './injectFlowAnimations'

const SVG_NS = 'http://www.w3.org/2000/svg'

const BADGE_HEIGHT = 22
const BADGE_PADDING_X = 9
const BADGE_FONT_SIZE = 10
const BADGE_RX = 11

function findNodeGroup(doc: Document, normalizedId: string): Element | null {
  return Array.from(doc.querySelectorAll('g[id]')).find(g => {
    const id = g.getAttribute('id') ?? ''
    const m = id.match(/flowchart-(.+)-(\d+)$/)
    return m ? normalizeNodeId(m[1]) === normalizedId : false
  }) ?? null
}

function getOwnTranslate(el: Element): { tx: number; ty: number } {
  const t = el.getAttribute('transform') ?? ''
  const m = t.match(/translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/)
  if (m) return { tx: parseFloat(m[1]), ty: parseFloat(m[2]) }
  return { tx: 0, ty: 0 }
}

function approxBBoxFromPathD(d: string): { x: number; y: number; width: number; height: number } | null {
  // Extract only endpoint coordinates from each SVG path command.
  // Arc commands (A/a) have 7 params: rx ry x-rotation large-arc-flag sweep-flag x y.
  // Treating all numbers as (x,y) pairs corrupts the bbox when arc flags (0/1) mix in.
  const points: Array<[number, number]> = []
  const tokenRe = /([MmLlHhVvCcSsQqTtAaZz])|(-?[\d.]+(?:e[-+]?\d+)?)/gi
  let cmd = ''
  let params: number[] = []

  function flush() {
    if (!cmd) return
    const c = cmd.toUpperCase()
    const isRel = cmd === cmd.toLowerCase() && cmd !== 'Z'
    const last = points[points.length - 1] ?? [0, 0]

    const resolve = (px: number, py: number): [number, number] =>
      isRel ? [last[0] + px, last[1] + py] : [px, py]

    if (c === 'M' || c === 'L' || c === 'T') {
      for (let i = 0; i + 1 < params.length; i += 2)
        points.push(resolve(params[i], params[i + 1]))
    } else if (c === 'H') {
      for (const v of params) points.push(isRel ? [last[0] + v, last[1]] : [v, last[1]])
    } else if (c === 'V') {
      for (const v of params) points.push(isRel ? [last[0], last[1] + v] : [last[0], v])
    } else if (c === 'C') {
      // Cubic bezier: x1 y1 x2 y2 x y — endpoints only for bbox approx
      for (let i = 0; i + 5 < params.length; i += 6)
        points.push(resolve(params[i + 4], params[i + 5]))
    } else if (c === 'S' || c === 'Q') {
      // Smooth cubic / quadratic: x1 y1 x y or x1 y1 x y
      for (let i = 0; i + 3 < params.length; i += 4)
        points.push(resolve(params[i + 2], params[i + 3]))
    } else if (c === 'A') {
      // Arc: rx ry x-rotation large-arc-flag sweep-flag x y
      for (let i = 0; i + 6 < params.length; i += 7)
        points.push(resolve(params[i + 5], params[i + 6]))
    }
    params = []
  }

  let token: RegExpExecArray | null
  while ((token = tokenRe.exec(d)) !== null) {
    if (token[1]) {
      flush()
      cmd = token[1]
    } else if (token[2] !== undefined) {
      params.push(Number(token[2]))
    }
  }
  flush()

  if (points.length < 2) return null
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const [x, y] of points) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  if (!isFinite(minX)) return null
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

const INJECTED_CLASSES = new Set(['ng-ghost', 'ng-inner-rim', 'ng-fill-tint-overlay', 'np-ripple', 'np-pulse'])

function isInjectedEl(el: Element): boolean {
  const cls = el.getAttribute('class') ?? ''
  return cls.split(/\s+/).some(c => INJECTED_CLASSES.has(c))
}

function getNodeBBox(nodeGroup: Element): { x: number; y: number; width: number; height: number } | null {
  const labelGroup = nodeGroup.querySelector('g.label')

  // Try rect first — skip injected rects (ng-ghost, np-pulse, etc.) which have inflated
  // stroke-widths that don't reflect the actual node boundary.
  for (const rect of Array.from(nodeGroup.querySelectorAll('rect'))) {
    if (labelGroup?.contains(rect)) continue
    if (isInjectedEl(rect)) continue
    const w = parseFloat(rect.getAttribute('width') ?? '0')
    const h = parseFloat(rect.getAttribute('height') ?? '0')
    if (w <= 0 || h <= 0) continue
    return {
      x: parseFloat(rect.getAttribute('x') ?? '0'),
      y: parseFloat(rect.getAttribute('y') ?? '0'),
      width: w,
      height: h,
    }
  }

  // Fall back to largest-area path (handles cylinders, stadium shapes)
  let best: { x: number; y: number; width: number; height: number } | null = null
  let bestArea = 0
  for (const path of Array.from(nodeGroup.querySelectorAll('path[d]'))) {
    if (labelGroup?.contains(path)) continue
    if (isInjectedEl(path)) continue
    const bbox = approxBBoxFromPathD(path.getAttribute('d') ?? '')
    if (!bbox) continue
    const area = bbox.width * bbox.height
    if (area > bestArea) { bestArea = area; best = bbox }
  }
  return best
}

export function injectNodeBadges(svg: string, entries: BadgeEntry[]): InjectorResult {
  if (entries.length === 0) return { svg, unmatched: [] }

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

  for (const entry of entries) {
    const nodeGroup = findNodeGroup(doc, normalizeNodeId(entry.nodeId))
    if (!nodeGroup) {
      if (false) console.debug(`[node-badge] ${entry.nodeId}: no SVG group found`)
      unmatched.push(entry.nodeId)
      continue
    }

    const bbox = getNodeBBox(nodeGroup)
    if (!bbox) {
      if (false) console.debug(`[node-badge] ${entry.nodeId}: bbox not found`)
      unmatched.push(entry.nodeId)
      continue
    }

    const { tx, ty } = getOwnTranslate(nodeGroup)
    if (false) console.debug(`[node-badge] ${entry.nodeId} ${entry.direction}: bbox=${JSON.stringify(bbox)} tx=${tx} ty=${ty}`)

    const textWidth = entry.label.length * 5.5
    const badgeWidth = textWidth + BADGE_PADDING_X * 2

    let badgeX: number, badgeY: number, textX: number, textY: number

    const direction = entry.direction

    if (entry.direction === 'top' || entry.direction === 'bottom') {
      const centreX = tx + bbox.x + bbox.width / 2
      const edgeY = entry.direction === 'top'
        ? ty + bbox.y
        : ty + bbox.y + bbox.height
      badgeX = centreX - badgeWidth / 2
      badgeY = entry.direction === 'top'
        ? edgeY - BADGE_HEIGHT
        : edgeY
      textX = centreX
      textY = badgeY + BADGE_HEIGHT / 2 + BADGE_FONT_SIZE / 2 - 1
    } else {
      // left or right
      const centreY = ty + bbox.y + bbox.height / 2
      const edgeX = entry.direction === 'left'
        ? tx + bbox.x
        : tx + bbox.x + bbox.width
      badgeX = edgeX - badgeWidth / 2
      badgeY = centreY - BADGE_HEIGHT / 2
      textX = edgeX
      textY = centreY + BADGE_FONT_SIZE / 2 - 1
    }

    const badgeGroup = doc.createElementNS(SVG_NS, 'g')
    badgeGroup.setAttribute('data-node-badge', `${entry.nodeId}-${direction}`)
    if (entry.outline) {
      badgeGroup.setAttribute('style', `filter: drop-shadow(0 0 5px ${entry.outline});`)
    }

    const badgeRect = doc.createElementNS(SVG_NS, 'rect')
    badgeRect.setAttribute('x', String(badgeX))
    badgeRect.setAttribute('y', String(badgeY))
    badgeRect.setAttribute('width', String(badgeWidth))
    badgeRect.setAttribute('height', String(BADGE_HEIGHT))
    badgeRect.setAttribute('rx', String(BADGE_RX))
    const strokeStyle = entry.outline
      ? `stroke: ${entry.outline} !important; stroke-width: 1.5px !important;`
      : `stroke: none !important;`
    badgeRect.setAttribute('style', `fill: ${entry.bgColor} !important; ${strokeStyle}`)

    const badgeText = doc.createElementNS(SVG_NS, 'text')
    badgeText.setAttribute('x', String(textX))
    badgeText.setAttribute('y', String(textY))
    badgeText.setAttribute('text-anchor', 'middle')
    badgeText.setAttribute('font-size', String(BADGE_FONT_SIZE))
    badgeText.setAttribute('font-weight', 'bold')
    badgeText.setAttribute('font-family', 'sans-serif')
    badgeText.setAttribute('style', `fill: ${entry.textColor} !important; font-size: ${BADGE_FONT_SIZE}px !important; font-weight: bold !important;`)
    badgeText.textContent = entry.label

    badgeGroup.appendChild(badgeRect)
    badgeGroup.appendChild(badgeText)
    nodeGroup.parentNode?.appendChild(badgeGroup)
    if (false) console.debug(`[node-badge] ${entry.nodeId} ${entry.direction}: injected at x=${badgeX.toFixed(1)} y=${badgeY.toFixed(1)} w=${badgeWidth.toFixed(1)}`)
    injected = true
  }

  if (!injected && unmatched.length === 0) return { svg, unmatched }

  if (injected) expandViewBoxForBadges(doc)

  return {
    svg: injected ? new XMLSerializer().serializeToString(doc) : svg,
    unmatched,
  }
}

function expandViewBoxForBadges(doc: Document): void {
  const svgEl = doc.documentElement
  const vb = svgEl.getAttribute('viewBox')
  if (!vb) return

  const parts = vb.trim().split(/[\s,]+/).map(Number)
  if (parts.length !== 4 || parts.some(isNaN)) return

  let [minX, minY, vbW, vbH] = parts

  for (const badgeGroup of Array.from(doc.querySelectorAll('[data-node-badge]'))) {
    const rect = badgeGroup.querySelector('rect')
    if (!rect) continue
    const bx = parseFloat(rect.getAttribute('x') ?? '0')
    const by = parseFloat(rect.getAttribute('y') ?? '0')
    const bw = parseFloat(rect.getAttribute('width') ?? '0')
    const bh = parseFloat(rect.getAttribute('height') ?? '0')

    const left = bx, right = bx + bw, top = by, bottom = by + bh

    if (left < minX) { vbW += minX - left; minX = left }
    if (top < minY) { vbH += minY - top; minY = top }
    if (right > minX + vbW) vbW = right - minX
    if (bottom > minY + vbH) vbH = bottom - minY
  }

  svgEl.setAttribute('viewBox', `${minX} ${minY} ${vbW} ${vbH}`)
}
