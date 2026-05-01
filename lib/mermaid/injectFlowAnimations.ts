import { parseSvgDoc } from './parseSvgDoc'
import type { DotAnimationConfig } from './style'
import { normalizeNodeId } from './parseMetaBlocks'

const SVG_NS = 'http://www.w3.org/2000/svg'

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

export interface InjectorResult {
  svg: string
  unmatched: string[]
}

export function injectFlowAnimations(
  svg: string,
  config: DotAnimationConfig,
  perEdgeOverrides?: Map<string, Partial<DotAnimationConfig>>,
  skipEdges?: Set<string>,
): InjectorResult {
  // If global disabled and no per-edge overrides, nothing to do
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

  // Track which override keys were actually matched to an SVG path
  const matchedOverrideKeys = new Set<string>()

  let injected = false
  for (const path of paths) {
    const id = path.getAttribute('id')
    if (!id) continue

    const edgeKey = edgeKeyFromPathId(id)

    // Check skipEdges
    if (edgeKey && skipEdges && skipEdges.has(edgeKey)) continue

    // Determine effective config for this edge
    const override = edgeKey ? perEdgeOverrides?.get(edgeKey) : undefined
    const effectiveConfig = override ? { ...config, ...override } : config

    // If global is disabled and there's no per-edge override, skip
    if (!config.enabled && !override) continue

    if (edgeKey && override) matchedOverrideKeys.add(edgeKey)

    const count = Math.max(1, effectiveConfig.particleCount ?? 1)
    for (let i = 0; i < count; i++) {
      const begin = count > 1 ? `${(effectiveConfig.speed * i / count).toFixed(3)}s` : '0s'

      const circle = doc.createElementNS(SVG_NS, 'circle')
      circle.setAttribute('r', '3')
      circle.setAttribute('fill', effectiveConfig.color)
      circle.setAttribute('opacity', '0.9')

      const animateMotion = doc.createElementNS(SVG_NS, 'animateMotion')
      animateMotion.setAttribute('dur', `${effectiveConfig.speed}s`)
      animateMotion.setAttribute('data-sim-base-dur', String(effectiveConfig.speed))
      animateMotion.setAttribute('begin', begin)
      animateMotion.setAttribute('repeatCount', 'indefinite')

      const mpath = doc.createElementNS(SVG_NS, 'mpath')
      mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${id}`)

      animateMotion.appendChild(mpath)
      circle.appendChild(animateMotion)

      path.parentNode?.insertBefore(circle, path.nextSibling)
    }
    injected = true
  }

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
