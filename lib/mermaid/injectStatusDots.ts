import { parseSvgDoc } from './parseSvgDoc'
import { normalizeNodeId } from './parseMetaBlocks'
import type { StatusDotEntry, StatusDotPosition } from './parseMetaBlocks'
import type { InjectorResult } from './injectFlowAnimations'

const SVG_NS = 'http://www.w3.org/2000/svg'

function findNodeGroup(doc: Document, normalizedNodeId: string): Element | null {
  const allGroups = Array.from(doc.querySelectorAll('g[id]'))
  return allGroups.find(g => {
    const id = g.getAttribute('id') ?? ''
    const match = id.match(/flowchart-(.+)-(\d+)$/)
    if (!match) return false
    return normalizeNodeId(match[1]) === normalizedNodeId
  }) ?? null
}

function getBBoxFromRect(nodeGroup: Element): { x: number; y: number; width: number; height: number } | null {
  const labelGroup = nodeGroup.querySelector('g.label')
  for (const rect of Array.from(nodeGroup.querySelectorAll('rect'))) {
    if (labelGroup && labelGroup.contains(rect)) continue
    const width = parseFloat(rect.getAttribute('width') ?? '0')
    const height = parseFloat(rect.getAttribute('height') ?? '0')
    if (width <= 0 || height <= 0) continue
    return {
      x: parseFloat(rect.getAttribute('x') ?? '0'),
      y: parseFloat(rect.getAttribute('y') ?? '0'),
      width,
      height,
    }
  }
  return null
}

function approxBBoxFromPathD(d: string): { x: number; y: number; width: number; height: number } | null {
  const nums = (d.match(/-?[\d.]+(?:e[-+]?\d+)?/gi) ?? []).map(Number).filter(n => !isNaN(n))
  if (nums.length < 4) return null
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i]; const y = nums[i + 1]
    if (minX > x) minX = x; if (maxX < x) maxX = x
    if (minY > y) minY = y; if (maxY < y) maxY = y
  }
  if (!isFinite(minX)) return null
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

function getTranslate(el: Element): { tx: number; ty: number } {
  const t = el.getAttribute('transform') ?? ''
  const m = t.match(/translate\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/)
  return m ? { tx: parseFloat(m[1]), ty: parseFloat(m[2]) } : { tx: 0, ty: 0 }
}

function getBBoxFromPaths(nodeGroup: Element): { x: number; y: number; width: number; height: number } | null {
  const labelGroup = nodeGroup.querySelector('g.label')
  let bestBBox: { x: number; y: number; width: number; height: number } | null = null
  let bestArea = 0
  for (const path of Array.from(nodeGroup.querySelectorAll('path[d]'))) {
    if (labelGroup && labelGroup.contains(path)) continue
    const raw = approxBBoxFromPathD(path.getAttribute('d') ?? '')
    if (!raw) continue
    const { tx, ty } = getTranslate(path)
    // Mermaid translates paths by exactly (-width/2, -height/2), so the true bbox
    // origin is tx,ty and the dimensions are |tx|*2, |ty|*2.
    // Raw coordinate parsing is unreliable for relative-command paths (cylinders).
    const x = tx !== 0 ? tx : raw.x
    const y = ty !== 0 ? ty : raw.y
    const width = tx !== 0 ? Math.abs(tx) * 2 : raw.width
    const height = ty !== 0 ? Math.abs(ty) * 2 : raw.height
    const bbox = { x, y, width, height }
    const area = bbox.width * bbox.height
    if (area > bestArea) { bestArea = area; bestBBox = bbox }
  }
  return bestBBox
}

function getLabelWidth(nodeGroup: Element): number | null {
  const fo = nodeGroup.querySelector('g.label foreignObject')
  if (!fo) return null
  const w = parseFloat(fo.getAttribute('width') ?? '0')
  return w > 0 ? w : null
}

function computeDotCenter(
  bbox: { x: number; y: number; width: number; height: number },
  position: StatusDotPosition,
  size: number,
  labelWidth: number | null,
): { cx: number; cy: number } {
  const r = size / 2
  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2
  // For left/right, align dot with the label edge rather than the node border
  const labelLeft = labelWidth !== null ? centerX - labelWidth / 2 : bbox.x + r + 6
  const labelRight = labelWidth !== null ? centerX + labelWidth / 2 : bbox.x + bbox.width - r - 6
  switch (position) {
    case 'left':       return { cx: labelLeft - r - 4, cy: centerY }
    case 'right':      return { cx: labelRight + r + 4, cy: centerY }
    case 'top-left':   return { cx: bbox.x, cy: bbox.y }
    case 'top-right':  return { cx: bbox.x + bbox.width, cy: bbox.y }
    case 'top-center': return { cx: centerX, cy: bbox.y }
    case 'left-inset': return { cx: bbox.x + r + 4, cy: centerY }
    case 'center':     return { cx: centerX, cy: centerY }
  }
}

function buildKeyframes(animId: string, style: StatusDotEntry['style'], size: number): string {
  const r = size / 2
  switch (style) {
    case 'breathe':
      return `@keyframes sd-breathe-${animId}{0%,100%{opacity:1}50%{opacity:0.35}}`
    case 'blink':
      return `@keyframes sd-blink-${animId}{0%,49%{opacity:1}50%,100%{opacity:0}}`
    case 'sonar':
    case 'ripple': {
      return `@keyframes sd-ring-${animId}{0%{r:${r}px;opacity:0.8}100%{r:${r * 3}px;opacity:0}}`
    }
  }
}

function buildAnimation(animId: string, style: StatusDotEntry['style'], speed: number): string {
  switch (style) {
    case 'breathe': return `sd-breathe-${animId} ${speed}s ease-in-out infinite`
    case 'blink':   return `sd-blink-${animId} ${speed}s step-start infinite`
    case 'sonar':
    case 'ripple':  return 'none'
  }
}

export function injectStatusDots(
  svg: string,
  entries: StatusDotEntry[],
): InjectorResult {
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
  const allKeyframes: string[] = []

  for (const entry of entries) {
    const nodeId = entry.nodeId
    if (!nodeId) continue

    const normalizedId = normalizeNodeId(nodeId)
    const nodeGroup = findNodeGroup(doc, normalizedId)
    if (!nodeGroup) { unmatched.push(nodeId); continue }

    const rectBBox = getBBoxFromRect(nodeGroup)
    const bbox = rectBBox ?? getBBoxFromPaths(nodeGroup)
    if (!bbox) { unmatched.push(nodeId); continue }

    const animId = normalizedId
    const labelWidth = getLabelWidth(nodeGroup)
    const { cx, cy } = computeDotCenter(bbox, entry.position, entry.size, labelWidth)
    const r = entry.size / 2

    allKeyframes.push(buildKeyframes(animId, entry.style, entry.size))

    // Core dot group
    const dotGroup = doc.createElementNS(SVG_NS, 'g')
    dotGroup.setAttribute('data-status-dot', nodeId)

    // Ring circles for sonar/ripple
    if (entry.style === 'sonar' || entry.style === 'ripple') {
      for (let i = 0; i < entry.rippleCount; i++) {
        const ring = doc.createElementNS(SVG_NS, 'circle')
        ring.setAttribute('cx', String(cx))
        ring.setAttribute('cy', String(cy))
        ring.setAttribute('r', String(r))
        ring.setAttribute('data-sd-ring', String(i))
        const delay = (entry.speed / entry.rippleCount) * i
        const ringColorStyle = entry.style === 'sonar'
          ? `fill:none;stroke:${entry.color};stroke-width:1.5`
          : `fill:${entry.color};fill-opacity:0.4`
        ring.setAttribute('style', `${ringColorStyle};animation:sd-ring-${animId} ${entry.speed}s ease-out ${delay}s infinite`)
        dotGroup.appendChild(ring)
      }
    }

    // Core circle
    const core = doc.createElementNS(SVG_NS, 'circle')
    core.setAttribute('cx', String(cx))
    core.setAttribute('cy', String(cy))
    core.setAttribute('r', String(r))
    core.setAttribute('data-sd-core', '1')
    const coreAnim = buildAnimation(animId, entry.style, entry.speed)
    const coreStyle = coreAnim !== 'none'
      ? `fill:${entry.color};animation:${coreAnim}`
      : `fill:${entry.color}`
    core.setAttribute('style', coreStyle)
    dotGroup.appendChild(core)

    nodeGroup.appendChild(dotGroup)
    injected = true
  }

  // allKeyframes is only populated when bbox resolves (same entries that set injected=true),
  // so if nothing was injected there are no keyframes to write either.
  if (!injected && unmatched.length === 0) return { svg, unmatched }

  // Inject keyframes into a <style data-sd> block in the SVG
  if (allKeyframes.length > 0) {
    const svgEl = doc.querySelector('svg')
    if (svgEl) {
      let styleEl = svgEl.querySelector('style[data-sd]') as Element | null
      if (!styleEl) {
        styleEl = doc.createElementNS(SVG_NS, 'style')
        styleEl.setAttribute('data-sd', '1')
        svgEl.insertBefore(styleEl, svgEl.firstChild)
      }
      styleEl.textContent = (styleEl.textContent ?? '') + allKeyframes.join('')
    }
  }

  const serialized = injected ? new XMLSerializer().serializeToString(doc) : svg
  return { svg: injected ? serialized : svg, unmatched }
}
