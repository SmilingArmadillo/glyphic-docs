/**
 * Strip negative width/height attributes from <marker> and <use> elements.
 *
 * Mermaid generates markers with width="-4" height="-4" for arrow sizing.
 * Browsers reject these with console warnings when parsing or rendering the SVG.
 * Replacing them with 1 is safe: the values control refX/refY offset math inside
 * Mermaid's own renderer, which has already consumed them before we touch the string.
 */
export function sanitizeSvgString(svg: string): string {
  return svg
    .replace(
      /(<(?:marker|use)\b[^>]*?)\b(width|height)="-\d+(\.\d+)?"/g,
      '$1$2="1"',
    )
    // Mermaid renders \n in node labels as <br>, which is invalid XML.
    // Self-close them so DOMParser's strict XML mode doesn't reject the SVG.
    .replace(/<br\s*>/gi, '<br/>')
}

/**
 * Parse an SVG string into a Document using DOMParser.
 * Sanitizes negative width/height on marker/use elements before parsing.
 */
export function parseSvgDoc(svg: string): Document | null {
  const cleaned = sanitizeSvgString(svg)
  const parser = new DOMParser()
  const doc = parser.parseFromString(cleaned, 'image/svg+xml')
  if (doc.querySelector('parsererror')) return null
  return doc
}
