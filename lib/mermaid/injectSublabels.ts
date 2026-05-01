import { parseSvgDoc } from './parseSvgDoc'
import { normalizeNodeId } from './parseMetaBlocks'
import type { StyleEntry } from './parseMetaBlocks'
import type { InjectorResult } from './injectFlowAnimations'

const SVG_NS = 'http://www.w3.org/2000/svg'

// Extra vertical space to add to the node rect to accommodate the sublabel line.
// ~12px text at 0.75em + 2px margin-top + 4px bottom padding.
const SUBLABEL_HEIGHT_EXPANSION = 18

function findNodeGroup(doc: Document, normalizedNodeId: string): Element | null {
  const allGroups = Array.from(doc.querySelectorAll('g[id]'))
  return allGroups.find(g => {
    const id = g.getAttribute('id') ?? ''
    const match = id.match(/flowchart-(.+)-(\d+)$/)
    if (!match) return false
    return normalizeNodeId(match[1]) === normalizedNodeId
  }) ?? null
}

// Expand all rects in the node group downward (increase height, keep top edge fixed).
// Skips rects inside g.label (label background). Applies to all rects including
// injected clones (ng-ghost, ng-fill-tint-overlay, np-pulse) so borders track the expansion.
function expandNodeRects(nodeGroup: Element, expansion: number): void {
  const labelGroup = nodeGroup.querySelector('g.label')
  for (const rect of Array.from(nodeGroup.querySelectorAll('rect'))) {
    if (labelGroup?.contains(rect)) continue
    const h = parseFloat(rect.getAttribute('height') ?? '0')
    if (h <= 0) continue
    rect.setAttribute('height', String(h + expansion))
  }
}

export function injectSublabels(
  svg: string,
  entries: StyleEntry[],
): InjectorResult {
  const sublabelEntries = entries.filter(e => e.sublabel)
  if (sublabelEntries.length === 0) return { svg, unmatched: [] }

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

  for (const entry of sublabelEntries) {
    const normalizedId = normalizeNodeId(entry.nodeId)
    const nodeGroup = findNodeGroup(doc, normalizedId)
    if (!nodeGroup) {
      unmatched.push(entry.nodeId)
      continue
    }

    const sublabelText = entry.sublabel!

    const fo = nodeGroup.querySelector('foreignObject')
    if (fo) {
      const allDivs = Array.from(fo.querySelectorAll('div'))
      const labelDiv = allDivs.find(d =>
        d.children.length > 0 || (d.textContent ?? '').trim().length > 0
      ) ?? allDivs[0]

      if (labelDiv) {
        const sublabelDiv = doc.createElement('div')
        sublabelDiv.setAttribute(
          'style',
          'font-size:0.75em;opacity:0.55;text-align:center;margin-top:2px;line-height:1.2',
        )
        sublabelDiv.textContent = sublabelText
        labelDiv.appendChild(sublabelDiv)
        expandNodeRects(nodeGroup, SUBLABEL_HEIGHT_EXPANSION)
        injected = true
        continue
      }
    }

    const labelGroup = nodeGroup.querySelector('g.label')
    if (labelGroup) {
      const textEl = labelGroup.querySelector('text')
      if (textEl) {
        const bbox = textEl.getBBox?.()
        const dy = bbox ? `${bbox.height / 2 + 2}` : '1.2em'
        const tspan = doc.createElementNS(SVG_NS, 'tspan')
        tspan.setAttribute('x', textEl.getAttribute('x') ?? '0')
        tspan.setAttribute('dy', dy)
        tspan.setAttribute('font-size', '0.75em')
        tspan.setAttribute('opacity', '0.55')
        tspan.setAttribute('text-anchor', 'middle')
        tspan.textContent = sublabelText
        textEl.appendChild(tspan)
        expandNodeRects(nodeGroup, SUBLABEL_HEIGHT_EXPANSION)
        injected = true
        continue
      }
    }

    unmatched.push(entry.nodeId)
  }

  if (!injected && unmatched.length === 0) return { svg, unmatched }
  return { svg: injected ? new XMLSerializer().serializeToString(doc) : svg, unmatched }
}
