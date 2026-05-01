import { parseSvgDoc } from './parseSvgDoc'
import { normalizeNodeId } from './parseMetaBlocks'
import { findNodeGroup, findClusterGroup, findPrimaryShape, findClusterRect, ensureDefs } from './svgShapeUtils'
import type { StyleEntry, GlowConfig } from './parseMetaBlocks'
import type { InjectorResult } from './injectFlowAnimations'


const SVG_NS = 'http://www.w3.org/2000/svg'

// Intensity lookup tables
const OUTER_HALO_STD_DEV = { subtle: 3, medium: 6, strong: 10 } as const
const OUTER_HALO_STROKE_DELTA = { subtle: 4, medium: 8, strong: 14 } as const
const OUTER_HALO_OPACITY = { subtle: 0.5, medium: 0.45, strong: 0.4 } as const

const INNER_RIM_STD_DEV = { subtle: 4, medium: 6, strong: 9 } as const
const INNER_RIM_STROKE_WIDTH = { subtle: 6, medium: 10, strong: 16 } as const
const INNER_RIM_OPACITY = { subtle: 0.4, medium: 0.45, strong: 0.5 } as const

const FILL_TINT_OPACITY = { subtle: 0.15, medium: 0.22, strong: 0.35 } as const

function ensureOuterHaloFilter(doc: Document, stdDev: number): string {
  const filterId = `ng-outer-halo-${stdDev}`
  if (doc.getElementById(filterId)) return filterId

  const defs = ensureDefs(doc)
  const filter = doc.createElementNS(SVG_NS, 'filter')
  filter.setAttribute('id', filterId)
  filter.setAttribute('x', '-50%')
  filter.setAttribute('y', '-50%')
  filter.setAttribute('width', '200%')
  filter.setAttribute('height', '200%')

  const blur = doc.createElementNS(SVG_NS, 'feGaussianBlur')
  blur.setAttribute('stdDeviation', String(stdDev))
  filter.appendChild(blur)

  defs.appendChild(filter)
  return filterId
}

function ensureInnerRimFilter(doc: Document, stdDev: number): string {
  const filterId = `ng-inner-rim-${stdDev}`
  if (doc.getElementById(filterId)) return filterId

  const defs = ensureDefs(doc)
  const filter = doc.createElementNS(SVG_NS, 'filter')
  filter.setAttribute('id', filterId)
  filter.setAttribute('x', '-10%')
  filter.setAttribute('y', '-10%')
  filter.setAttribute('width', '120%')
  filter.setAttribute('height', '120%')

  const blur = doc.createElementNS(SVG_NS, 'feGaussianBlur')
  blur.setAttribute('stdDeviation', String(stdDev))
  blur.setAttribute('result', 'blur')
  filter.appendChild(blur)

  const composite = doc.createElementNS(SVG_NS, 'feComposite')
  composite.setAttribute('in', 'blur')
  composite.setAttribute('in2', 'SourceGraphic')
  composite.setAttribute('operator', 'in')
  composite.setAttribute('result', 'inner')
  filter.appendChild(composite)

  const merge = doc.createElementNS(SVG_NS, 'feMerge')
  const n1 = doc.createElementNS(SVG_NS, 'feMergeNode')
  n1.setAttribute('in', 'SourceGraphic')
  const n2 = doc.createElementNS(SVG_NS, 'feMergeNode')
  n2.setAttribute('in', 'inner')
  merge.appendChild(n1)
  merge.appendChild(n2)
  filter.appendChild(merge)

  defs.appendChild(filter)
  return filterId
}

function cloneShapeAsGhost(doc: Document, shape: Element, className: string): Element {
  const ghost = doc.createElementNS(SVG_NS, shape.tagName.toLowerCase() as string)
  for (const attr of Array.from(shape.attributes)) {
    ghost.setAttribute(attr.name, attr.value)
  }
  ghost.setAttribute('class', className)
  ghost.removeAttribute('id')
  // Strip any stroke/fill overrides copied from the source shape — the caller
  // sets its own values. Leaving !important style rules here would override them.
  ghost.removeAttribute('style')
  return ghost
}

function injectOuterHalo(
  doc: Document,
  nodeGroup: Element,
  shape: Element,
  color: string,
  intensity: GlowConfig['intensity'],
): void {
  const stdDev = OUTER_HALO_STD_DEV[intensity]
  const filterId = ensureOuterHaloFilter(doc, stdDev)
  const strokeDelta = OUTER_HALO_STROKE_DELTA[intensity]
  const opacity = OUTER_HALO_OPACITY[intensity]

  const existingStrokeWidth = parseFloat(shape.getAttribute('stroke-width') ?? '2')
  const ghostStrokeWidth = existingStrokeWidth + strokeDelta
  const ghost = cloneShapeAsGhost(doc, shape, 'ng-ghost')
  ghost.setAttribute('fill', 'none')
  ghost.setAttribute('stroke', color)
  ghost.setAttribute('stroke-width', String(ghostStrokeWidth))
  ghost.setAttribute('opacity', String(opacity))
  ghost.setAttribute('filter', `url(#${filterId})`)
  // !important beats Mermaid's CSS class rules that target rect/path by element type
  ghost.setAttribute('style', `fill:none !important;stroke:${color} !important;stroke-width:${ghostStrokeWidth}px !important`)

  nodeGroup.insertBefore(ghost, shape)
}

function injectInnerRim(
  doc: Document,
  nodeGroup: Element,
  shape: Element,
  color: string,
  intensity: GlowConfig['intensity'],
): void {
  const stdDev = INNER_RIM_STD_DEV[intensity]
  const filterId = ensureInnerRimFilter(doc, stdDev)
  const strokeWidth = INNER_RIM_STROKE_WIDTH[intensity]
  const opacity = INNER_RIM_OPACITY[intensity]

  const ghost = cloneShapeAsGhost(doc, shape, 'ng-inner-rim')
  ghost.setAttribute('fill', 'none')
  ghost.setAttribute('stroke', color)
  ghost.setAttribute('stroke-width', String(strokeWidth))
  ghost.setAttribute('opacity', String(opacity))
  ghost.setAttribute('filter', `url(#${filterId})`)

  shape.parentNode?.insertBefore(ghost, shape.nextSibling)
}

function injectFillTint(
  doc: Document,
  nodeGroup: Element,
  shape: Element,
  normalizedId: string,
  color: string,
  intensity: GlowConfig['intensity'],
): void {
  const gradId = `ng-fill-tint-${normalizedId}`
  const centerOpacity = FILL_TINT_OPACITY[intensity]

  const defs = ensureDefs(doc)
  const existing = defs.querySelector(`#${CSS.escape(gradId)}`)
  if (existing) existing.remove()

  const grad = doc.createElementNS(SVG_NS, 'radialGradient')
  grad.setAttribute('id', gradId)
  grad.setAttribute('cx', '50%')
  grad.setAttribute('cy', '50%')
  grad.setAttribute('r', '60%')
  grad.setAttribute('gradientUnits', 'objectBoundingBox')

  const stop1 = doc.createElementNS(SVG_NS, 'stop')
  stop1.setAttribute('offset', '0%')
  stop1.setAttribute('stop-color', color)
  stop1.setAttribute('stop-opacity', String(centerOpacity))
  grad.appendChild(stop1)

  const stop2 = doc.createElementNS(SVG_NS, 'stop')
  stop2.setAttribute('offset', '100%')
  stop2.setAttribute('stop-color', color)
  stop2.setAttribute('stop-opacity', '0')
  grad.appendChild(stop2)

  defs.appendChild(grad)

  const groupId = nodeGroup.getAttribute('id') ?? ''
  let styleEl = doc.documentElement.querySelector(':scope > style[data-gf]')
  if (!styleEl) {
    styleEl = doc.createElementNS(SVG_NS, 'style')
    styleEl.setAttribute('data-gf', '1')
    doc.documentElement.appendChild(styleEl)
  }
  const rule = `#${CSS.escape(groupId)} > rect.ng-fill-tint-overlay, #${CSS.escape(groupId)} > .ng-fill-tint-overlay { fill: url(#${gradId}) !important; }`
  styleEl.textContent = (styleEl.textContent ?? '') + rule

  const overlay = cloneShapeAsGhost(doc, shape, 'ng-fill-tint-overlay')
  overlay.setAttribute('fill', `url(#${gradId})`)
  overlay.removeAttribute('stroke')
  overlay.removeAttribute('stroke-width')
  overlay.removeAttribute('filter')
  const labelGroup = nodeGroup.querySelector(':scope > g.label')
  if (labelGroup) {
    nodeGroup.insertBefore(overlay, labelGroup)
  } else {
    nodeGroup.appendChild(overlay)
  }
}

export function injectNodeGlow(
  svg: string,
  entries: StyleEntry[],
): InjectorResult {
  const activeEntries = entries.filter(e => e.glow)
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

    const glow = entry.glow!
    const normalizedId = normalizeNodeId(nodeId)
    const effectiveColor = glow.color ?? entry.outline ?? '#ffffff'

    const nodeGroup = findNodeGroup(doc, normalizedId)
    const isCluster = nodeGroup === null
    const group = nodeGroup ?? findClusterGroup(doc, normalizedId)

    if (!group) {
      unmatched.push(nodeId)
      continue
    }

    const shape = isCluster ? findClusterRect(group) : findPrimaryShape(group)

    if (!shape) {
      unmatched.push(nodeId)
      continue
    }

    if (glow.variant === 'outer-halo' || glow.variant === 'combined') {
      injectOuterHalo(doc, group, shape, effectiveColor, glow.intensity)
      injected = true
    }

    if (glow.variant === 'inner-rim') {
      injectInnerRim(doc, group, shape, effectiveColor, glow.intensity)
      injected = true
    }

    if (glow.variant === 'fill-tint' || glow.variant === 'combined') {
      injectFillTint(doc, group, shape, normalizedId, effectiveColor, glow.intensity)
      injected = true
    }
  }

  if (!injected && unmatched.length === 0) return { svg, unmatched }

  const serialized = injected ? new XMLSerializer().serializeToString(doc) : svg
  return { svg: injected ? serialized : svg, unmatched }
}
