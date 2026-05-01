import { parseSvgDoc } from './parseSvgDoc'
import { normalizeNodeId } from './parseMetaBlocks'
import type { AnimateEntry } from './parseMetaBlocks'
import type { InjectorResult } from './injectFlowAnimations'

const SVG_NS = 'http://www.w3.org/2000/svg'
const INSET_PADDING = 4

function findNodeGroup(doc: Document, normalizedNodeId: string): Element | null {
  const allGroups = Array.from(doc.querySelectorAll('g[id]'))
  return allGroups.find(g => {
    const id = g.getAttribute('id') ?? ''
    const match = id.match(/flowchart-(.+)-(\d+)$/)
    if (!match) return false
    return normalizeNodeId(match[1]) === normalizedNodeId
  }) ?? null
}

/**
 * Find the stadium rect element within a node group.
 * Mermaid's old renderer uses <rect rx="..." height="..."> for stadium nodes.
 * Returns the rect if found, null otherwise.
 */
function findStadiumRect(nodeGroup: Element): Element | null {
  const allShapes = Array.from(nodeGroup.querySelectorAll(
    'rect[height], circle[r], ellipse[rx], polygon[points]'
  ))
  // Prefer a rect with rx set (stadium shape has rx = height/2)
  const stadium = allShapes.find(el =>
    el.tagName.toLowerCase() === 'rect' &&
    el.getAttribute('rx') !== null &&
    el.getAttribute('height') !== null
  )
  if (stadium) return stadium
  // Fall back to any rect with geometry
  const rectWithHeight = allShapes.find(el => el.tagName.toLowerCase() === 'rect')
  return rectWithHeight ?? null
}

/**
 * Extract an approximate bounding box from a path `d` attribute by collecting
 * all numeric coordinate values. Works well enough for stadium-shaped paths
 * centered at the origin, where the path covers the full node extent.
 *
 * Returns null if the path has too few numbers to form a box.
 */
function approxBBoxFromPathD(d: string): { x: number; y: number; width: number; height: number } | null {
  const nums = (d.match(/-?[\d.]+(?:e[-+]?\d+)?/gi) ?? []).map(Number).filter(n => !isNaN(n))
  if (nums.length < 4) return null

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  // Path coordinate pairs alternate x, y for all command types (M, L, C, etc.)
  // We read every pair — this approximates the convex hull of all control points.
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i]
    const y = nums[i + 1]
    if (minX > x) minX = x
    if (maxX < x) maxX = x
    if (minY > y) minY = y
    if (maxY < y) maxY = y
  }

  if (!isFinite(minX)) return null
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/**
 * Find the bounding box of a Mermaid v11 Rough.js stadium node.
 * The stadium is rendered as a <path> inside a <g class="basic label-container outer-path">.
 *
 * The shape is centered at origin within the node group; the group has a
 * translate() transform applied by the layout engine. We approximate the
 * shape bounds by scanning all <path d="..."> elements in the subtree,
 * excluding paths inside the <g class="label"> sub-group.
 *
 * Returns null if no usable path is found.
 */
function findPathBasedBBox(nodeGroup: Element): { x: number; y: number; width: number; height: number } | null {
  // Collect all <path> elements in the node group, excluding those inside g.label
  const allPaths = Array.from(nodeGroup.querySelectorAll('path[d]'))
  const labelGroup = nodeGroup.querySelector('g.label')

  let bestBBox: { x: number; y: number; width: number; height: number } | null = null
  let bestArea = 0

  for (const path of allPaths) {
    // Skip paths inside the label group
    if (labelGroup && labelGroup.contains(path)) continue

    const d = path.getAttribute('d') ?? ''
    const bbox = approxBBoxFromPathD(d)
    if (!bbox) continue

    const area = bbox.width * bbox.height
    if (area > bestArea) {
      bestArea = area
      bestBBox = bbox
    }
  }

  return bestBBox
}

/**
 * Inject a filled ellipse into the left cap of stadium-shaped nodes.
 * Only processes entries where kind === 'node' && type === 'oval-inset'.
 *
 * Supports both rendering strategies:
 * 1. Old Mermaid renderer: stadium is a <rect rx="height/2">.
 *    cx = rect.x + height/2,  cy = rect.y + height/2,  r = height/2 - INSET_PADDING
 *
 * 2. New Mermaid v11 renderer (Rough.js): stadium is a <path> centered at origin.
 *    We approximate bounds from path coordinate data:
 *    cx = bbox.x + height/2,  cy = bbox.y + height/2,  r = height/2 - INSET_PADDING
 *
 * Returns { svg, unmatched } — same pattern as all other injectors.
 */
export function injectNodeDecorations(
  svg: string,
  entries: AnimateEntry[],
): InjectorResult {
  const ovalEntries = entries.filter(e => e.kind === 'node' && e.type === 'oval-inset')
  if (ovalEntries.length === 0) return { svg, unmatched: [] }

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

  for (const entry of ovalEntries) {
    const nodeId = entry.nodeId ?? ''
    if (!nodeId) continue

    const normalizedId = normalizeNodeId(nodeId)
    const nodeGroup = findNodeGroup(doc, normalizedId)

    if (!nodeGroup) {
      unmatched.push(nodeId)
      continue
    }

    // --- Try old renderer: rect-based stadium ---
    const rectEl = findStadiumRect(nodeGroup)
    if (rectEl !== null && rectEl.tagName.toLowerCase() === 'rect') {
      const x = parseFloat(rectEl.getAttribute('x') ?? '0')
      const y = parseFloat(rectEl.getAttribute('y') ?? '0')
      const height = parseFloat(rectEl.getAttribute('height') ?? '0')

      if (height > 0) {
        const r = height / 2 - INSET_PADDING
        if (r > 0) {
          const cx = x + height / 2
          const cy = y + height / 2

          const ellipse = doc.createElementNS(SVG_NS, 'ellipse')
          ellipse.setAttribute('cx', String(cx))
          ellipse.setAttribute('cy', String(cy))
          ellipse.setAttribute('rx', String(r))
          ellipse.setAttribute('ry', String(r))
          ellipse.setAttribute('fill', entry.color ?? '#3b82f6')
          ellipse.setAttribute('class', 'nd-oval-inset')

          rectEl.parentNode?.insertBefore(ellipse, rectEl.nextSibling)
          injected = true
          continue
        }
      }
    }

    // --- Try new renderer: path-based stadium (Mermaid v11 with Rough.js) ---
    const pathBBox = findPathBasedBBox(nodeGroup)
    if (pathBBox !== null && pathBBox.height > 0) {
      const height = pathBBox.height
      const r = height / 2 - INSET_PADDING
      if (r > 0) {
        // The node group is centered at its transform origin; shapes are at origin.
        // Left cap center x = leftmost edge + half-height (the cap radius)
        const cx = pathBBox.x + height / 2
        const cy = pathBBox.y + height / 2

        const ellipse = doc.createElementNS(SVG_NS, 'ellipse')
        ellipse.setAttribute('cx', String(cx))
        ellipse.setAttribute('cy', String(cy))
        ellipse.setAttribute('rx', String(r))
        ellipse.setAttribute('ry', String(r))
        ellipse.setAttribute('fill', entry.color ?? '#3b82f6')
        ellipse.setAttribute('class', 'nd-oval-inset')

        // Insert at beginning of nodeGroup so it renders behind the path
        nodeGroup.insertBefore(ellipse, nodeGroup.firstChild)
        injected = true
        continue
      }
    }

    // Could not resolve geometry for this node
    unmatched.push(nodeId)
  }

  if (!injected && unmatched.length === 0) return { svg, unmatched }

  const serialized = injected ? new XMLSerializer().serializeToString(doc) : svg
  return { svg: injected ? serialized : svg, unmatched }
}
