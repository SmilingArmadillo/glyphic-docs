/**
 * Normalize two SVGs to share the same viewBox dimensions.
 *
 * Problem: before/after SVGs have different intrinsic sizes. When both are
 * displayed in same-sized panels at the same CSS scale, the smaller one
 * appears smaller and is positioned differently — making the comparison
 * visually incoherent.
 *
 * Solution: expand both SVGs to the same viewBox (max width × max height),
 * anchoring each diagram at the top-left corner (translate 0,0). The smaller
 * diagram gets extra whitespace on the right and/or bottom. This ensures
 * both diagrams start from the same position, so elements that correspond
 * between before/after line up correctly at the divider.
 *
 * The expansion is purely in SVG coordinate space — no pixel scaling.
 */

// Inlined from useDynamicMaxScale (pure function, no React dependency)
function parseSvgDimensions(svgString: string): { width: number; height: number } | null {
  let doc: Document
  try {
    doc = new DOMParser().parseFromString(svgString, 'text/html')
  } catch {
    return null
  }
  const svgEl = doc.querySelector('svg')
  if (!svgEl) return null
  const viewBox = svgEl.getAttribute('viewBox')
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/)
    const w = parseFloat(parts[2])
    const h = parseFloat(parts[3])
    if (Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0) return { width: w, height: h }
  }
  const w = parseFloat(svgEl.getAttribute('width') ?? '')
  const h = parseFloat(svgEl.getAttribute('height') ?? '')
  if (Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0) return { width: w, height: h }
  return null
}

export interface NormalizedPair {
  before: string
  after: string
}

/**
 * Given two SVG strings, return both expanded to the same viewBox dimensions
 * (max width × max height), with each diagram anchored at the top-left.
 * If dimensions cannot be parsed for either SVG, returns them unchanged.
 *
 * leftPadFraction: fraction of the shared canvas width to add as left padding.
 * Use this to ensure no diagram content falls behind the compare divider's
 * minimum position. E.g. pass 0.10 when DIVIDER_MIN = 10.
 */
export function normalizeSvgViewBox(
  beforeSvg: string,
  afterSvg: string,
  leftPadFraction = 0,
): NormalizedPair {
  const dimsBefore = parseSvgDimensions(beforeSvg)
  const dimsAfter  = parseSvgDimensions(afterSvg)

  // If either is unparseable, return unchanged — no normalization
  if (!dimsBefore || !dimsAfter) return { before: beforeSvg, after: afterSvg }

  const sharedW = Math.max(dimsBefore.width, dimsAfter.width)
  const sharedH = Math.max(dimsBefore.height, dimsAfter.height)

  // If already the same size and no padding needed, nothing to do
  if (
    dimsBefore.width === dimsAfter.width &&
    dimsBefore.height === dimsAfter.height &&
    leftPadFraction === 0
  ) {
    return { before: beforeSvg, after: afterSvg }
  }

  // Left padding: shift all content rightward by this many SVG units so that
  // diagram elements never fall behind the compare divider's minimum position.
  const leftPad = Math.round(sharedW * leftPadFraction)
  const totalW  = sharedW + leftPad

  return {
    before: expandSvg(beforeSvg, dimsBefore.width, dimsBefore.height, totalW, sharedH, leftPad),
    after:  expandSvg(afterSvg,  dimsAfter.width,  dimsAfter.height,  totalW, sharedH, leftPad),
  }
}

/**
 * Expand a single SVG to targetW × targetH.
 * If leftPad > 0, all diagram content is shifted right by leftPad SVG units
 * by updating the viewBox minX to -leftPad (so the origin moves left, making
 * existing content appear shifted right within the larger canvas).
 * Extra space is added to the right and bottom — the diagram itself
 * stays at the same relative position it was rendered by Mermaid.
 */
function expandSvg(
  svgString: string,
  origW: number,
  origH: number,
  targetW: number,
  targetH: number,
  leftPad = 0,
): string {
  // Fast path: already the right size and no padding
  if (origW === targetW && origH === targetH && leftPad === 0) return svgString

  let result = svgString

  // Update viewBox: shift minX left by leftPad so content appears shifted right
  result = result.replace(
    /(<svg\b[^>]*)\bviewBox\s*=\s*["'][^"']*["']/i,
    `$1viewBox="${-leftPad} 0 ${targetW} ${targetH}"`,
  )

  // Update width attribute
  result = result.replace(
    /(<svg\b[^>]*)\bwidth\s*=\s*["'][^"']*["']/i,
    `$1width="${targetW}"`,
  )

  // Update height attribute
  result = result.replace(
    /(<svg\b[^>]*)\bheight\s*=\s*["'][^"']*["']/i,
    `$1height="${targetH}"`,
  )

  // Update style="max-width: Xpx" if present
  result = result.replace(
    /(<svg\b[^>]*\bstyle\s*=\s*["'][^"']*)max-width\s*:\s*[\d.]+px/i,
    `$1max-width: ${targetW}px`,
  )

  return result
}
