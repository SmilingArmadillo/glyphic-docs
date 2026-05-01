import { parseSvgDoc } from './parseSvgDoc'
import { normalizeNodeId } from './parseMetaBlocks'
import type { DiagramDiff } from './diffDiagram'

const DIFF_CSS = `
.mmd-diff-added rect,
.mmd-diff-added polygon,
.mmd-diff-added circle,
.mmd-diff-added ellipse {
  stroke: #22c55e !important;
  fill: rgba(34, 197, 94, 0.1) !important;
  filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.25));
}
.mmd-diff-added path.flowchart-link {
  stroke: #22c55e !important;
  opacity: 0.8;
}
.mmd-diff-removed rect,
.mmd-diff-removed polygon,
.mmd-diff-removed circle,
.mmd-diff-removed ellipse {
  stroke: #ef4444 !important;
  fill: rgba(239, 68, 68, 0.08) !important;
}
.mmd-diff-removed path.flowchart-link {
  stroke: #ef4444 !important;
  opacity: 0.5;
}
`

function findNodeGroup(doc: Document, normalizedId: string): Element | null {
  const allGroups = Array.from(doc.querySelectorAll('g[id]'))
  return allGroups.find(g => {
    const id = g.getAttribute('id') ?? ''
    const match = id.match(/flowchart-(.+)-(\d+)$/)
    if (!match) return false
    return normalizeNodeId(match[1]) === normalizedId
  }) ?? null
}

function findEdgePath(doc: Document, normFrom: string, normTo: string): Element | null {
  const allPaths = Array.from(doc.querySelectorAll('path[id]'))
  return allPaths.find(p => {
    const id = p.getAttribute('id') ?? ''
    const match = id.match(/^L-(.+)-(.+)-(\d+)$/)
    if (!match) return false
    return normalizeNodeId(match[1]) === normFrom && normalizeNodeId(match[2]) === normTo
  }) ?? null
}

function addClassToElement(el: Element, cls: string): void {
  const existing = el.getAttribute('class') ?? ''
  if (existing.split(/\s+/).includes(cls)) return
  el.setAttribute('class', existing ? `${existing} ${cls}` : cls)
}

function ensureStyleBlock(doc: Document, css: string): void {
  const existing = doc.querySelector('style')
  if (existing) {
    existing.textContent = (existing.textContent ?? '') + css
    return
  }
  const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = css
  doc.documentElement.insertBefore(style, doc.documentElement.firstChild)
}

export function injectDiffHighlights(
  svg: string,
  diff: DiagramDiff,
  side: 'before' | 'after',
): string {
  const targetNodes = side === 'before' ? diff.removedNodes : diff.addedNodes
  const targetEdges = side === 'before' ? diff.removedEdges : diff.addedEdges
  const cls         = side === 'before' ? 'mmd-diff-removed' : 'mmd-diff-added'

  if (targetNodes.size === 0 && targetEdges.size === 0) return svg

  let doc: Document
  try {
    const parsed = parseSvgDoc(svg)
    if (!parsed) return svg
    doc = parsed
  } catch {
    return svg
  }

  let injected = false

  for (const nodeId of targetNodes) {
    const group = findNodeGroup(doc, normalizeNodeId(nodeId))
    if (group) {
      addClassToElement(group, cls)
      injected = true
    }
  }

  for (const edge of targetEdges) {
    const [from, to] = edge.split('-->')
    if (!from || !to) continue
    const path = findEdgePath(doc, normalizeNodeId(from), normalizeNodeId(to))
    if (path) {
      addClassToElement(path, cls)
      injected = true
    }
  }

  if (!injected) return svg

  ensureStyleBlock(doc, DIFF_CSS)

  return new XMLSerializer().serializeToString(doc)
}
