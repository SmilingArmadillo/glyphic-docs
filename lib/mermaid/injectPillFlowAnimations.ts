import { parseSvgDoc } from './parseSvgDoc'
import type { PillFlowConfig, PillGlowPreset } from './style'
import { normalizeNodeId } from './parseMetaBlocks'
import type { InjectorResult } from './injectFlowAnimations'

const SVG_NS = 'http://www.w3.org/2000/svg'

// [stdDeviation, glowOpacity]
const GLOW_PRESETS: Record<PillGlowPreset, [number, number]> = {
  'none':   [0,   0],
  'subtle': [6,   0.7],
  'strong': [12,  0.9],
}

function edgeKeyFromPathId(id: string): string | null {
  const match = id.match(/L_(.+)_(.+)_(\d+)$/)
  if (!match) return null
  return `${normalizeNodeId(match[1])}-->${normalizeNodeId(match[2])}`
}

export function injectPillFlowAnimations(
  svg: string,
  config: PillFlowConfig,
  perEdgeOverrides?: Map<string, Partial<PillFlowConfig>>,
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

  // --- Inject glow filters into <defs> ---
  const filtersNeeded = new Map<number, string>() // stdDev -> filterId

  const globalStdDev = GLOW_PRESETS[config.glowPreset][0]
  if (config.enabled && globalStdDev > 0) {
    filtersNeeded.set(globalStdDev, `pf-glow-${globalStdDev}`)
  }
  if (perEdgeOverrides) {
    for (const override of perEdgeOverrides.values()) {
      if (override.glowPreset !== undefined) {
        const sd = GLOW_PRESETS[override.glowPreset][0]
        if (sd > 0) filtersNeeded.set(sd, `pf-glow-${sd}`)
      }
    }
  }

  if (filtersNeeded.size > 0) {
    let defs = doc.querySelector('defs')
    if (!defs) {
      defs = doc.createElementNS(SVG_NS, 'defs')
      doc.documentElement.insertBefore(defs, doc.documentElement.firstChild)
    }
    for (const [stdDev, filterId] of filtersNeeded) {
      const filter = doc.createElementNS(SVG_NS, 'filter')
      filter.setAttribute('id', filterId)
      filter.setAttribute('x', '-100%')
      filter.setAttribute('y', '-100%')
      filter.setAttribute('width', '300%')
      filter.setAttribute('height', '300%')
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

  const keyframeIds: string[] = []
  const matchedOverrideKeys = new Set<string>()
  let injected = false

  for (const path of paths) {
    const id = path.getAttribute('id')
    if (!id) continue

    const edgeKey = edgeKeyFromPathId(id)
    const override = edgeKey ? perEdgeOverrides?.get(edgeKey) : undefined

    if (!config.enabled && !override) continue
    if (edgeKey && override) matchedOverrideKeys.add(edgeKey)

    // Merge config
    const ec: PillFlowConfig = { ...config }
    if (override) {
      if (override.color !== undefined) ec.color = override.color
      if (override.speed !== undefined) ec.speed = override.speed
      if (override.glowPreset !== undefined) ec.glowPreset = override.glowPreset
      if (override.width !== undefined) ec.width = override.width
      if (override.height !== undefined) ec.height = override.height
      if (override.particleCount !== undefined) ec.particleCount = override.particleCount
    }

    const d = path.getAttribute('d') ?? ''
    const [stdDev, glowOpacity] = GLOW_PRESETS[ec.glowPreset]
    const filterId = `pf-glow-${stdDev}`
    const halfW = ec.width / 2
    const halfH = ec.height / 2
    const rx = halfH

    const count = Math.max(1, ec.particleCount ?? 1)
    let insertAfter: Element = path

    for (let i = 0; i < count; i++) {
      const delay = count > 1 ? `${(ec.speed * i / count).toFixed(3)}s` : '0s'
      const kfId = `pf-${id.replace(/[^a-zA-Z0-9]/g, '-')}-p${i}`
      keyframeIds.push(kfId)
      const animStyle = `offset-path:path('${d}'); offset-rotate:auto; animation:${kfId} ${ec.speed}s linear ${delay} infinite;`

      // Glow group (behind sharp pill)
      if (stdDev > 0) {
        const glowG = doc.createElementNS(SVG_NS, 'g')
        glowG.setAttribute('class', 'pf-glow')
        glowG.setAttribute('style', animStyle)
        glowG.setAttribute('data-sim-base-dur', String(ec.speed))
        const glowRect = doc.createElementNS(SVG_NS, 'rect')
        glowRect.setAttribute('x', String(-halfW))
        glowRect.setAttribute('y', String(-halfH))
        glowRect.setAttribute('width', String(ec.width))
        glowRect.setAttribute('height', String(ec.height))
        glowRect.setAttribute('rx', String(rx))
        glowRect.setAttribute('fill', ec.color)
        glowRect.setAttribute('opacity', String(glowOpacity))
        glowRect.setAttribute('filter', `url(#${filterId})`)
        glowG.appendChild(glowRect)
        path.parentNode?.insertBefore(glowG, insertAfter.nextSibling)
        insertAfter = glowG
      }

      // Sharp pill group
      const pillG = doc.createElementNS(SVG_NS, 'g')
      pillG.setAttribute('class', 'pf-pill')
      pillG.setAttribute('style', animStyle)
      pillG.setAttribute('data-sim-base-dur', String(ec.speed))
      const pillRect = doc.createElementNS(SVG_NS, 'rect')
      pillRect.setAttribute('x', String(-halfW))
      pillRect.setAttribute('y', String(-halfH))
      pillRect.setAttribute('width', String(ec.width))
      pillRect.setAttribute('height', String(ec.height))
      pillRect.setAttribute('rx', String(rx))
      pillRect.setAttribute('fill', ec.color)
      pillRect.setAttribute('opacity', '1')
      pillG.appendChild(pillRect)
      path.parentNode?.insertBefore(pillG, insertAfter.nextSibling)
      insertAfter = pillG
    }
    injected = true
  }

  if (!injected) return { svg, unmatched: [] }

  // Inject <style> block with all @keyframes
  const style = doc.createElementNS(SVG_NS, 'style')
  const kfCss = keyframeIds
    .map(kfId => `@keyframes ${kfId} { from { offset-distance: 0%; } to { offset-distance: 100%; } }`)
    .join('\n')
  style.textContent = kfCss
  doc.documentElement.insertBefore(style, doc.documentElement.firstChild)

  // Collect unmatched override keys
  const unmatched: string[] = []
  if (perEdgeOverrides) {
    for (const key of perEdgeOverrides.keys()) {
      if (!matchedOverrideKeys.has(key)) unmatched.push(key)
    }
  }

  return { svg: new XMLSerializer().serializeToString(doc), unmatched }
}
