import type { PanelSection } from './types'

/**
 * Parses an @panel block body into an array of prose sections.
 *
 * Each section is separated by a blank line within the block. The first
 * non-blank line of each section becomes the heading; subsequent non-blank
 * lines are joined with a space to form the body.
 *
 * Example input lines:
 *   Trust Zones
 *   User path (orange) flows through CF→APIGW→LambdaU.
 *   Admin path (blue) flows through MC→LambdaA.
 *
 *   Threat Surface
 *   LambdaA holds the decryption key and is highest risk.
 *
 * Produces:
 *   [
 *     { heading: 'Trust Zones', body: 'User path … Admin path …' },
 *     { heading: 'Threat Surface', body: 'LambdaA holds …' },
 *   ]
 */
export function parsePanelBlock(lines: string[]): PanelSection[] {
  const sections: PanelSection[] = []

  // Collect groups of non-blank lines separated by blank lines
  let group: string[] = []

  const flushGroup = () => {
    if (group.length === 0) return
    // A line starting with ● is always a body bullet, never a heading.
    // If the first line is a bullet, carry it into the last open section instead.
    if (group[0].startsWith('●') && sections.length > 0) {
      const last = sections[sections.length - 1]
      const extra = group.join(' ').trim()
      sections[sections.length - 1] = {
        heading: last.heading,
        body: last.body ? `${last.body} ${extra}` : extra,
      }
    } else {
      const heading = group[0]
      const body = group.slice(1).join(' ').trim()
      sections.push({ heading, body })
    }
    group = []
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flushGroup()
    } else {
      group.push(line)
    }
  }
  flushGroup()

  return sections
}
