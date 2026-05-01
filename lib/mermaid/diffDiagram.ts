// Pure string-only utility — no DOM APIs (document, window, DOMParser, XMLSerializer).
// Must be importable and runnable in Node.js without a browser shim.

import { normalizeNodeId } from './parseMetaBlocks'

export interface DiagramElements {
  nodes: Set<string>  // raw node IDs as written in source
  edges: Set<string>  // canonical "from-->to" pairs
}

export interface DiagramDiff {
  addedNodes: Set<string>
  removedNodes: Set<string>
  addedEdges: Set<string>
  removedEdges: Set<string>
}

// Strip node label/shape syntax and return the bare ID.
// Examples: "LB[Load Balancer]" → "LB", "DB[(Database)]" → "DB", "S1" → "S1"
// Also handles pipe-label right-hand side: "|label| B" → "B"
function stripNodeDecoration(raw: string): string {
  // Strip pipe-label prefix: |label| (appears when splitting A -->|label| B on the arrow)
  const pipeless = raw.startsWith('|') ? raw.replace(/^\|[^|]*\|\s*/, '') : raw
  return pipeless.replace(/[[({("'|>].*/, '').trim()
}

const SKIP_PREFIXES = ['flowchart', 'graph', 'subgraph', 'end', '%%', 'classDef', 'class ', 'click ', 'style ']

/**
 * Extract the set of node IDs and edge pairs from a clean MMD source string.
 * Lines that don't match known edge patterns are silently skipped.
 */
export function extractDiagramElements(mmd: string): DiagramElements {
  const nodes = new Set<string>()
  const edges = new Set<string>()

  const lines = mmd.split('\n')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (SKIP_PREFIXES.some(p => {
      const lower = line.toLowerCase()
      if (!lower.startsWith(p.toLowerCase())) return false
      const after = lower[p.length]
      return after === undefined || after === ' ' || after === '\t' || after === ':'
    })) continue

    // Arrow pattern covers: -->, ---, -.->. ==>, ==>
    const arrowPattern = /(-\.->|==>|-->|---|-\.-)/g
    const parts = line.split(arrowPattern)
    if (parts.length < 3) continue  // no arrow found

    const nodeParts: string[] = []
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim()
      if (!part) continue
      // Skip the arrow tokens themselves
      if (/^(-.->|==>|-->|---|-.-)$/.test(part)) continue
      // Strip edge labels: A -- "label" --> B
      const nodeRaw = part.replace(/\s*--.*/, '').trim()
      if (nodeRaw) nodeParts.push(nodeRaw)
    }

    if (nodeParts.length < 2) continue

    const nodeIds = nodeParts.map(stripNodeDecoration).filter(Boolean)
    for (const id of nodeIds) nodes.add(id)
    for (let i = 0; i < nodeIds.length - 1; i++) {
      edges.add(`${nodeIds[i]}-->${nodeIds[i + 1]}`)
    }
  }

  return { nodes, edges }
}

function normaliseEdge(edge: string): string {
  const [from, to] = edge.split('-->')
  return `${normalizeNodeId(from)}-->${normalizeNodeId(to)}`
}

/**
 * Compute the symmetric difference between two sets of diagram elements.
 * Node ID comparison is case-insensitive (via normalizeNodeId).
 */
export function computeDiff(before: DiagramElements, after: DiagramElements): DiagramDiff {
  const beforeNorm = new Map<string, string>()
  const afterNorm  = new Map<string, string>()

  for (const id of before.nodes) beforeNorm.set(normalizeNodeId(id), id)
  for (const id of after.nodes)  afterNorm.set(normalizeNodeId(id), id)

  const addedNodes   = new Set<string>()
  const removedNodes = new Set<string>()

  for (const [norm, raw] of afterNorm) {
    if (!beforeNorm.has(norm)) addedNodes.add(raw)
  }
  for (const [norm, raw] of beforeNorm) {
    if (!afterNorm.has(norm)) removedNodes.add(raw)
  }

  const beforeEdgesNorm = new Map<string, string>()
  const afterEdgesNorm  = new Map<string, string>()
  for (const e of before.edges) beforeEdgesNorm.set(normaliseEdge(e), e)
  for (const e of after.edges)  afterEdgesNorm.set(normaliseEdge(e), e)

  const addedEdges   = new Set<string>()
  const removedEdges = new Set<string>()

  for (const [norm, raw] of afterEdgesNorm) {
    if (!beforeEdgesNorm.has(norm)) addedEdges.add(raw)
  }
  for (const [norm, raw] of beforeEdgesNorm) {
    if (!afterEdgesNorm.has(norm)) removedEdges.add(raw)
  }

  return { addedNodes, removedNodes, addedEdges, removedEdges }
}
