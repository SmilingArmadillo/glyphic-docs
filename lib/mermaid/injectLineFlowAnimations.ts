import { parseSvgDoc } from './parseSvgDoc'
import type { LineFlowConfig, LineFlowMotionPreset, LineFlowGlowPreset } from './style'
import { normalizeNodeId } from './parseMetaBlocks'
import type { InjectorResult } from './injectFlowAnimations'

const SVG_NS = 'http://www.w3.org/2000/svg'

// keyTimes: [0, drawEnd, holdEnd, retractEnd, 1]
// dashoffset: pathLen → 0 (draw on) → 0 (hold) → -pathLen (retract) → -pathLen (rest)
// opacity:    0 → 1 (draw on) → 1 (hold) → 0 (retract) → 0 (rest)
export const MOTION_PRESETS: Record<LineFlowMotionPreset, [number, number, number]> = {
  //                         drawEnd  holdEnd  retractEnd
  'flash':     [0.25, 0.35, 0.60],
  'balanced':  [0.25, 0.50, 0.75],
  'long-hold': [0.20, 0.65, 0.85],
}

// [stdDeviation, glowStrokeMultiplier, glowOpacity]
export const GLOW_PRESETS: Record<LineFlowGlowPreset, [number, number, number]> = {
  'none':   [0,   0,  0],
  'subtle': [2.5, 3,  0.35],
  'strong': [5,   4,  0.5],
}

/**
 * Extracts the normalized edge key (e.g. "a-->b") from a Mermaid SVG path ID.
 * Mermaid generates path IDs as "{diagramId}-L_{from}_{to}_{n}".
 * The diagram ID prefix varies, so we match the L_{from}_{to}_{n} suffix.
 * Returns null if the ID doesn't match the expected pattern.
 */
function edgeKeyFromPathId(id: string): string | null {
  // Match suffix: L_{from}_{to}_{n}  (n is one or more digits at the end)
  const match = id.match(/L_(.+)_(.+)_(\d+)$/)
  if (!match) return null
  return `${normalizeNodeId(match[1])}-->${normalizeNodeId(match[2])}`
}

function getPathLength(path: Element): number {
  if (typeof (path as SVGPathElement).getTotalLength === 'function') {
    const len = (path as SVGPathElement).getTotalLength()
    if (len > 0) return Math.ceil(len) + 10
  }
  // Fallback: parse d attribute heuristically (control points cause underestimates on curves)
  const d = path.getAttribute('d') ?? ''
  const tokens = (d.match(/[-+]?[0-9]*\.?[0-9]+/g) ?? []).map(Number)
  const coords: [number, number][] = []
  for (let i = 0; i + 1 < tokens.length; i += 2) {
    coords.push([tokens[i], tokens[i + 1]])
  }
  if (coords.length < 2) return 200
  let len = 0
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i][0] - coords[i - 1][0]
    const dy = coords[i][1] - coords[i - 1][1]
    len += Math.sqrt(dx * dx + dy * dy)
  }
  return Math.max(50, Math.ceil(len) + 10)
}

function makeAnimate(
  doc: Document,
  attr: string,
  values: string,
  keyTimes: string,
  dur: string,
  begin: string,
): Element {
  const el = doc.createElementNS(SVG_NS, 'animate')
  el.setAttribute('attributeName', attr)
  el.setAttribute('values', values)
  el.setAttribute('keyTimes', keyTimes)
  el.setAttribute('keySplines', '0.4 0 0.2 1;0 0 1 1;0.6 0 0.4 1;0 0 1 1')
  el.setAttribute('calcMode', 'spline')
  el.setAttribute('dur', dur)
  el.setAttribute('begin', begin)
  el.setAttribute('repeatCount', 'indefinite')
  return el
}

export function injectLineFlowAnimations(
  svg: string,
  config: LineFlowConfig,
  perEdgeOverrides?: Map<string, Partial<LineFlowConfig>>,
  skipEdges?: Set<string>,
): InjectorResult {
  const hasPerEdgeWork = perEdgeOverrides && perEdgeOverrides.size > 0
  if (!config.enabled && !hasPerEdgeWork) return { svg, unmatched: [] }

  let doc: Document
  try {
    const parsed = parseSvgDoc(svg)
    if (!parsed) return { svg, unmatched: [] }
    doc = parsed
  } catch {
    return { svg, unmatched: [] }
  }

  const paths = Array.from(doc.querySelectorAll('path.flowchart-link'))
  if (paths.length === 0) return { svg, unmatched: [] }

  // Inject glow blur filter(s) into defs as needed.
  // We may need multiple filters if per-edge overrides have different glow presets.
  // Collect unique glow configs needed.
  const glowFiltersNeeded = new Map<string, number>() // filterId -> stdDev

  // For global glow
  const globalStdDev = GLOW_PRESETS[config.glowPreset][0]
  const globalFilterId = `lf-global-glow`
  if (config.enabled && globalStdDev > 0) {
    glowFiltersNeeded.set(globalFilterId, globalStdDev)
  }

  // For per-edge glow overrides
  if (perEdgeOverrides) {
    for (const [key, override] of perEdgeOverrides) {
      if (override.glowPreset !== undefined) {
        const stdDev = GLOW_PRESETS[override.glowPreset][0]
        const filterId = `lf-edge-${key.replace(/[^a-zA-Z0-9]/g, '-')}-glow`
        if (stdDev > 0) {
          glowFiltersNeeded.set(filterId, stdDev)
        }
      }
    }
  }

  if (glowFiltersNeeded.size > 0) {
    let defs = doc.querySelector('defs')
    if (!defs) {
      defs = doc.createElementNS(SVG_NS, 'defs')
      doc.documentElement.insertBefore(defs, doc.documentElement.firstChild)
    }
    for (const [filterId, stdDev] of glowFiltersNeeded) {
      const filter = doc.createElementNS(SVG_NS, 'filter')
      filter.setAttribute('id', filterId)
      filter.setAttribute('x', '-50%')
      filter.setAttribute('y', '-50%')
      filter.setAttribute('width', '200%')
      filter.setAttribute('height', '200%')
      const blur = doc.createElementNS(SVG_NS, 'feGaussianBlur')
      blur.setAttribute('stdDeviation', String(stdDev))
      blur.setAttribute('result', 'blur')
      const merge = doc.createElementNS(SVG_NS, 'feMerge')
      const n1 = doc.createElementNS(SVG_NS, 'feMergeNode')
      n1.setAttribute('in', 'blur')
      const n2 = doc.createElementNS(SVG_NS, 'feMergeNode')
      n2.setAttribute('in', 'SourceGraphic')
      merge.appendChild(n1)
      merge.appendChild(n2)
      filter.appendChild(blur)
      filter.appendChild(merge)
      defs.appendChild(filter)
    }
  }

  let injected = false
  const matchedOverrideKeys = new Set<string>()

  paths.forEach(path => {
    const id = path.getAttribute('id')
    if (!id) return

    const edgeKey = edgeKeyFromPathId(id)

    // Check skipEdges
    if (edgeKey && skipEdges && skipEdges.has(edgeKey)) return

    // Determine effective config for this edge
    const override = edgeKey ? perEdgeOverrides?.get(edgeKey) : undefined

    // If global is disabled and there's no per-edge override, skip
    if (!config.enabled && !override) return

    if (edgeKey && override) matchedOverrideKeys.add(edgeKey)

    // Merge config: start from global, apply override fields individually
    const effectiveConfig: LineFlowConfig = { ...config }
    if (override) {
      if (override.color !== undefined) effectiveConfig.color = override.color
      if (override.speed !== undefined) effectiveConfig.speed = override.speed
      if (override.motionPreset !== undefined) effectiveConfig.motionPreset = override.motionPreset
      if (override.glowPreset !== undefined) effectiveConfig.glowPreset = override.glowPreset
      if (override.particleCount !== undefined) effectiveConfig.particleCount = override.particleCount
    }

    const [drawEnd, holdEnd, retractEnd] = MOTION_PRESETS[effectiveConfig.motionPreset]
    const [stdDev, glowMult, glowOpacity] = GLOW_PRESETS[effectiveConfig.glowPreset]
    const dur = `${effectiveConfig.speed}s`
    const keyTimes = `0;${drawEnd};${holdEnd};${retractEnd};1`

    // Determine which filter to reference for glow
    let filterId: string
    if (override?.glowPreset !== undefined) {
      filterId = `lf-edge-${edgeKey!.replace(/[^a-zA-Z0-9]/g, '-')}-glow`
    } else {
      filterId = globalFilterId
    }

    const d = path.getAttribute('d') ?? ''
    const pathLen = getPathLength(path)
    const edgeStrokeWidth = parseFloat(path.getAttribute('stroke-width') ?? '2')

    const dashValues = `${pathLen};0;0;${-pathLen};${-pathLen}`
    const opacityValuesSharp = '0;1;1;0;0'
    const opacityValuesGlow = `0;${glowOpacity};${glowOpacity};0;0`

    const count = Math.max(1, effectiveConfig.particleCount ?? 1)
    let insertAfterNode: Element = path

    for (let i = 0; i < count; i++) {
      const begin = count > 1 ? `${(effectiveConfig.speed * i / count).toFixed(3)}s` : '0s'

      // Glow layer (wide blurred path, lower opacity)
      if (stdDev > 0) {
        const glowPath = doc.createElementNS(SVG_NS, 'path')
        glowPath.setAttribute('d', d)
        glowPath.setAttribute('stroke', effectiveConfig.color)
        glowPath.setAttribute('stroke-width', String(edgeStrokeWidth * glowMult))
        glowPath.setAttribute('fill', 'none')
        glowPath.setAttribute('stroke-linecap', 'round')
        glowPath.setAttribute('stroke-dasharray', `${pathLen} ${pathLen}`)
        glowPath.setAttribute('stroke-dashoffset', String(pathLen))
        glowPath.setAttribute('opacity', '0')
        glowPath.setAttribute('filter', `url(#${filterId})`)
        glowPath.setAttribute('class', 'lf-glow')
        const glowDashAnimate = makeAnimate(doc, 'stroke-dashoffset', dashValues, keyTimes, dur, begin)
        glowDashAnimate.setAttribute('data-sim-base-dur', String(effectiveConfig.speed))
        glowPath.appendChild(glowDashAnimate)
        glowPath.appendChild(makeAnimate(doc, 'opacity', opacityValuesGlow, keyTimes, dur, begin))
        path.parentNode?.insertBefore(glowPath, insertAfterNode.nextSibling)
        insertAfterNode = glowPath
      }

      // Sharp color layer (same stroke-width as original edge)
      const sharpPath = doc.createElementNS(SVG_NS, 'path')
      sharpPath.setAttribute('d', d)
      sharpPath.setAttribute('stroke', effectiveConfig.color)
      sharpPath.setAttribute('stroke-width', String(edgeStrokeWidth))
      sharpPath.setAttribute('fill', 'none')
      sharpPath.setAttribute('stroke-linecap', 'round')
      sharpPath.setAttribute('stroke-dasharray', `${pathLen} ${pathLen}`)
      sharpPath.setAttribute('stroke-dashoffset', String(pathLen))
      sharpPath.setAttribute('opacity', '0')
      sharpPath.setAttribute('class', 'lf-overlay')
      const sharpDashAnimate = makeAnimate(doc, 'stroke-dashoffset', dashValues, keyTimes, dur, begin)
      sharpDashAnimate.setAttribute('data-sim-base-dur', String(effectiveConfig.speed))
      sharpPath.appendChild(sharpDashAnimate)
      sharpPath.appendChild(makeAnimate(doc, 'opacity', opacityValuesSharp, keyTimes, dur, begin))

      path.parentNode?.insertBefore(sharpPath, insertAfterNode.nextSibling)
      insertAfterNode = sharpPath
    }
    injected = true
  })

  // Collect override keys that never matched any SVG path
  const unmatched: string[] = []
  if (perEdgeOverrides) {
    for (const key of perEdgeOverrides.keys()) {
      if (!matchedOverrideKeys.has(key)) {
        unmatched.push(key)
      }
    }
  }

  if (!injected) return { svg, unmatched }

  return { svg: new XMLSerializer().serializeToString(doc), unmatched }
}
