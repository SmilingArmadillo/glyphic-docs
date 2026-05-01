import { parseSvgDoc } from './parseSvgDoc'
import type { DiagramOpacity } from './style'

export function injectOpacity(svg: string, opacity: DiagramOpacity): string {
  // Fast path: nothing to do
  if (opacity.nodes === 1 && opacity.edges === 1 && opacity.labels === 1) {
    return svg
  }

  let doc: Document
  try {
    const parsed = parseSvgDoc(svg)
    if (!parsed) return svg
    doc = parsed
  } catch {
    return svg
  }

  let modified = false

  // Nodes
  if (opacity.nodes !== 1) {
    doc.querySelectorAll('.node').forEach(el => {
      el.setAttribute('opacity', String(opacity.nodes))
      modified = true
    })
  }

  // Edges
  if (opacity.edges !== 1) {
    doc.querySelectorAll('.edgeLabel, .edgePath').forEach(el => {
      el.setAttribute('opacity', String(opacity.edges))
      modified = true
    })
  }

  // Labels — targets all .label elements including those inside .edgeLabel containers.
  // When both opacity.edges and opacity.labels are non-1, .edgeLabel elements receive
  // edges opacity on the container and labels opacity on inner .label nodes.
  if (opacity.labels !== 1) {
    doc.querySelectorAll('.label').forEach(el => {
      el.setAttribute('opacity', String(opacity.labels))
      modified = true
    })
  }

  if (!modified) return svg

  return new XMLSerializer().serializeToString(doc)
}
