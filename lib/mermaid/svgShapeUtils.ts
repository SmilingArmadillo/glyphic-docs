import { normalizeNodeId } from './parseMetaBlocks'

const SVG_NS = 'http://www.w3.org/2000/svg'

function extractPathEndpoints(d: string): Array<[number, number]> {
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
      for (let i = 0; i + 5 < params.length; i += 6)
        points.push(resolve(params[i + 4], params[i + 5]))
    } else if (c === 'S' || c === 'Q') {
      for (let i = 0; i + 3 < params.length; i += 4)
        points.push(resolve(params[i + 2], params[i + 3]))
    } else if (c === 'A') {
      // rx ry x-rotation large-arc-flag sweep-flag x y
      for (let i = 0; i + 6 < params.length; i += 7)
        points.push(resolve(params[i + 5], params[i + 6]))
    }
    params = []
  }

  let token: RegExpExecArray | null
  while ((token = tokenRe.exec(d)) !== null) {
    if (token[1]) { flush(); cmd = token[1] }
    else if (token[2] !== undefined) params.push(Number(token[2]))
  }
  flush()
  return points
}

export function findNodeGroup(doc: Document, normalizedNodeId: string): Element | null {
  const allGroups = Array.from(doc.querySelectorAll('g[id]'))
  return allGroups.find(g => {
    const id = g.getAttribute('id') ?? ''
    const match = id.match(/flowchart-(.+)-(\d+)$/)
    if (!match) return false
    return normalizeNodeId(match[1]) === normalizedNodeId
  }) ?? null
}

export function findClusterGroup(doc: Document, normalizedNodeId: string): Element | null {
  const clusters = Array.from(doc.querySelectorAll('g.cluster[id]'))
  for (const g of clusters) {
    const id = g.getAttribute('id') ?? ''
    const parts = id.split('-')
    for (let n = parts.length - 1; n >= 1; n--) {
      const suffix = parts.slice(n).join('-')
      if (normalizeNodeId(suffix) === normalizedNodeId) return g
      // Also try stripping a trailing numeric segment (e.g. "AWS-0" → "AWS")
      const withoutTrailingNum = suffix.replace(/-\d+$/, '')
      if (withoutTrailingNum !== suffix && normalizeNodeId(withoutTrailingNum) === normalizedNodeId) return g
    }
  }
  return null
}

// Classes added by our own injectors — must never be mistaken for the original node shape.
const INJECTED_CLASSES = new Set(['ng-ghost', 'ng-inner-rim', 'ng-fill-tint-overlay', 'np-ripple', 'np-pulse'])

export function isInjected(el: Element): boolean {
  return el.classList ? [...el.classList].some(c => INJECTED_CLASSES.has(c)) : false
}

export function findPrimaryShape(nodeGroup: Element): Element | null {
  const labelGroup = nodeGroup.querySelector('g.label')

  // Old renderer: prefer rect with rx (stadium), fall back to any rect/circle/ellipse/polygon
  const candidates = Array.from(nodeGroup.querySelectorAll('rect, circle, ellipse, polygon'))
  for (const el of candidates) {
    if (labelGroup && labelGroup.contains(el)) continue
    // Skip label background rects (no geometry attrs)
    if (el.tagName.toLowerCase() === 'rect') {
      const hasGeometry = el.getAttribute('width') || el.getAttribute('height')
      if (!hasGeometry) continue
    }
    return el
  }

  // Mermaid v11: path-based nodes — pick the largest path outside g.label
  const allPaths = Array.from(nodeGroup.querySelectorAll('path[d]'))
  let bestPath: Element | null = null
  let bestArea = 0

  for (const path of allPaths) {
    if (labelGroup && labelGroup.contains(path)) continue
    const d = path.getAttribute('d') ?? ''
    const pts = extractPathEndpoints(d)
    if (pts.length < 2) continue
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const [x, y] of pts) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
    const area = (maxX - minX) * (maxY - minY)
    if (area > bestArea) {
      bestArea = area
      bestPath = path
    }
  }

  return bestPath
}

export function findClusterRect(clusterGroup: Element): Element | null {
  return clusterGroup.querySelector(':scope > rect') ?? null
}

export function ensureDefs(doc: Document): Element {
  const svgRoot = doc.documentElement
  let defs = svgRoot.querySelector(':scope > defs')
  if (!defs) {
    defs = doc.createElementNS(SVG_NS, 'defs')
    svgRoot.insertBefore(defs, svgRoot.firstChild)
  }
  return defs
}
