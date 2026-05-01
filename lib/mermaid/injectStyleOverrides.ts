import { parseSvgDoc } from './parseSvgDoc'
import { normalizeNodeId } from './parseMetaBlocks'
import type { StyleEntry } from './parseMetaBlocks'
import type { InjectorResult } from './injectFlowAnimations'
import { findNodeGroup, findClusterGroup, findPrimaryShape, findClusterRect } from './svgShapeUtils'

const SVG_NS = 'http://www.w3.org/2000/svg'

export function injectStyleOverrides(
  svg: string,
  entries: StyleEntry[],
): InjectorResult {
  const activeEntries = entries.filter(e => e.outline || e.color || e.fontWeight || e.textGlow)
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

  const allGroupIds = Array.from(doc.querySelectorAll('g[id]')).map(g => g.getAttribute('id') ?? '')
  console.debug('[style] all SVG group ids:', allGroupIds)

  for (const entry of activeEntries) {
    const nodeId = entry.nodeId
    if (!nodeId) continue

    const normalizedId = normalizeNodeId(nodeId)
    console.debug(`[style] looking for normalized="${normalizedId}" in SVG groups`)

    // Try node match first
    const nodeGroup = findNodeGroup(doc, normalizedId)
    if (nodeGroup) {
      const shape = findPrimaryShape(nodeGroup)
      if (!shape) {
        unmatched.push(nodeId)
        continue
      }

      // Mermaid sizes foreignObject tightly at layout time, before our styles are injected.
      // Any style that changes text metrics (bold, color, glow) can overflow the declared
      // width/height. Setting overflow:visible on the foreignObject and its inner div lets
      // text paint outside those bounds instead of clipping.
      const fo = nodeGroup.querySelector('g.label foreignObject')
      if (fo) {
        fo.setAttribute('style', `${fo.getAttribute('style') ? fo.getAttribute('style') + '; ' : ''}overflow: visible;`)
        const innerDiv = fo.querySelector('div')
        if (innerDiv) {
          const existing = innerDiv.getAttribute('style') ?? ''
          if (!existing.includes('overflow')) {
            innerDiv.setAttribute('style', `${existing ? existing + '; ' : ''}overflow: visible;`)
          }
        }
      }

      if (entry.outline) {
        const strokeStyle = `stroke: ${entry.outline} !important; stroke-width: 2px !important;`

        const existingShape = shape.getAttribute('style') ?? ''
        const baseShape = existingShape.replace(/stroke\s*:[^;]+;?/g, '').replace(/stroke-width\s*:[^;]+;?/g, '').trim()
        shape.setAttribute('style', `${baseShape ? baseShape + '; ' : ''}${strokeStyle}`)
        shape.setAttribute('stroke', entry.outline)
        shape.setAttribute('stroke-width', '2')

        // Mermaid v11 sets stroke on g.label-container via CSS class rules.
        // Only override it if the primary shape is NOT inside label-container (i.e. the container
        // is a separate wrapper whose CSS stroke would otherwise win via specificity).
        // If the primary shape IS inside label-container, stroking the container too would
        // produce a second visible border on top of the already-stroked inner shape.
        const labelContainer = nodeGroup.querySelector('g.label-container, g[class*="label-container"]')
        if (labelContainer && labelContainer !== shape && !labelContainer.contains(shape)) {
          const existingLc = labelContainer.getAttribute('style') ?? ''
          const baseLc = existingLc.replace(/stroke\s*:[^;]+;?/g, '').replace(/stroke-width\s*:[^;]+;?/g, '').trim()
          labelContainer.setAttribute('style', `${baseLc ? baseLc + '; ' : ''}${strokeStyle}`)
        }
      }

      if (entry.color) {
        const colorStyle = `fill: ${entry.color} !important; color: ${entry.color} !important;`
        // SVG <text> elements inside g.label
        nodeGroup.querySelectorAll('g.label text, g.label tspan').forEach(el => {
          const existing = el.getAttribute('style') ?? ''
          el.setAttribute('style', `${existing ? existing + '; ' : ''}${colorStyle}`)
        })
        // HTML label <span> elements (htmlLabels mode)
        nodeGroup.querySelectorAll('g.label span, g.label p, g.label div').forEach(el => {
          const existing = (el as HTMLElement).getAttribute('style') ?? ''
          el.setAttribute('style', `${existing ? existing + '; ' : ''}color: ${entry.color} !important;`)
        })
      }

      if (entry.fontWeight) {
        const fwStyle = `font-weight: ${entry.fontWeight} !important;`
        nodeGroup.querySelectorAll('g.label text, g.label tspan').forEach(el => {
          const existing = el.getAttribute('style') ?? ''
          el.setAttribute('style', `${existing ? existing + '; ' : ''}${fwStyle}`)
        })
        nodeGroup.querySelectorAll('g.label span, g.label p, g.label div').forEach(el => {
          const existing = el.getAttribute('style') ?? ''
          el.setAttribute('style', `${existing ? existing + '; ' : ''}${fwStyle}`)
        })
      }

      if (entry.textGlow) {
        const stdDev = entry.textGlow === 'subtle' ? 1.5 : entry.textGlow === 'strong' ? 4 : 2.5

        let defs = doc.querySelector('defs')
        if (!defs) {
          defs = doc.createElementNS(SVG_NS, 'defs')
          doc.documentElement.insertBefore(defs, doc.documentElement.firstChild)
        }

        const filterId = `glyphic-text-glow-${normalizedId}`
        if (!doc.getElementById(filterId)) {
          const filter = doc.createElementNS(SVG_NS, 'filter')
          filter.setAttribute('id', filterId)
          filter.setAttribute('x', '-50%')
          filter.setAttribute('y', '-50%')
          filter.setAttribute('width', '200%')
          filter.setAttribute('height', '200%')

          const feBlur = doc.createElementNS(SVG_NS, 'feGaussianBlur')
          feBlur.setAttribute('stdDeviation', String(stdDev))
          feBlur.setAttribute('result', 'blur')

          const feMerge = doc.createElementNS(SVG_NS, 'feMerge')
          const mergeNode1 = doc.createElementNS(SVG_NS, 'feMergeNode')
          mergeNode1.setAttribute('in', 'blur')
          const mergeNode2 = doc.createElementNS(SVG_NS, 'feMergeNode')
          mergeNode2.setAttribute('in', 'SourceGraphic')
          feMerge.appendChild(mergeNode1)
          feMerge.appendChild(mergeNode2)

          filter.appendChild(feBlur)
          filter.appendChild(feMerge)
          defs.appendChild(filter)
        }

        // Apply filter to leaf text elements, not g.label itself.
        // Applying to g.label causes the browser to clip at the foreignObject
        // width/height boundary (set tight by Mermaid at layout time), truncating text.
        const labelGroup = nodeGroup.querySelector('g.label')
        if (labelGroup) {
          const filterStyle = `filter: url(#${filterId});`
          // HTML labels (foreignObject > div)
          const fo = labelGroup.querySelector('foreignObject')
          if (fo) {
            const innerDiv = fo.querySelector('div')
            if (innerDiv) {
              const existing = innerDiv.getAttribute('style') ?? ''
              innerDiv.setAttribute('style', `${existing ? existing + '; ' : ''}${filterStyle}`)
            }
          } else {
            // SVG text labels
            labelGroup.querySelectorAll('text, tspan').forEach(el => {
              const existing = el.getAttribute('style') ?? ''
              el.setAttribute('style', `${existing ? existing + '; ' : ''}${filterStyle}`)
            })
          }
        }
      }

      console.debug(`[style] ${nodeId}: set stroke=${entry.outline} color=${entry.color} on <${shape.tagName}> class="${shape.getAttribute('class') ?? ''}"`)

      injected = true
      continue
    }

    // Fall back to cluster match
    const clusterGroup = findClusterGroup(doc, normalizedId)
    if (clusterGroup) {
      if (entry.outline) {
        const rect = findClusterRect(clusterGroup)
        if (rect) {
          const strokeStyle = `stroke: ${entry.outline} !important; stroke-width: 2px !important;`
          const existing = rect.getAttribute('style') ?? ''
          const base = existing.replace(/stroke\s*:[^;]+;?/g, '').replace(/stroke-width\s*:[^;]+;?/g, '').trim()
          rect.setAttribute('style', `${base ? base + '; ' : ''}${strokeStyle}`)
          rect.setAttribute('stroke', entry.outline)
          rect.setAttribute('stroke-width', '2')
        }
      }

      if (entry.color) {
        const colorStyle = `fill: ${entry.color} !important; color: ${entry.color} !important;`
        clusterGroup.querySelectorAll('g.cluster-label text, g.cluster-label tspan').forEach(el => {
          const existing = el.getAttribute('style') ?? ''
          el.setAttribute('style', `${existing ? existing + '; ' : ''}${colorStyle}`)
        })
        clusterGroup.querySelectorAll('g.cluster-label span, g.cluster-label p, g.cluster-label div').forEach(el => {
          const existing = el.getAttribute('style') ?? ''
          el.setAttribute('style', `${existing ? existing + '; ' : ''}color: ${entry.color} !important;`)
        })
      }

      console.debug(`[style] ${nodeId}: set cluster stroke=${entry.outline} color=${entry.color}`)
      injected = true
      continue
    }

    console.debug(`[style] ${nodeId}: NO GROUP FOUND`)
    unmatched.push(nodeId)
  }

  if (!injected && unmatched.length === 0) return { svg, unmatched }

  const serialized = injected ? new XMLSerializer().serializeToString(doc) : svg
  return { svg: injected ? serialized : svg, unmatched }
}
