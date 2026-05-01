import { parseKv } from './parseKv'
import type { StyleEntry, GlowConfig, ParsedStyleBlock } from './types'

/**
 * Extract fill=<value> from a KV string where the value may contain nested
 * parentheses (e.g. linear-gradient(145deg,#abc,#def)).  parseKv splits on
 * commas outside quotes, so a bare gradient value would be truncated.
 *
 * Returns the extracted fill value (or undefined) and the remaining KV string
 * with the fill= segment removed so it can be fed to parseKv normally.
 */
function extractFill(kvStr: string): { fill: string | undefined; remaining: string } {
  // Locate fill= token — may appear at start or after a comma
  const match = kvStr.match(/(?:^|,)\s*fill=/)
  if (!match) return { fill: undefined, remaining: kvStr }

  const fillKeyStart = kvStr.indexOf('fill=', match.index ?? 0)
  if (fillKeyStart === -1) return { fill: undefined, remaining: kvStr }

  const valueStart = fillKeyStart + 'fill='.length
  let value = ''
  let depth = 0
  let i = valueStart
  const quoted = kvStr[i] === '"'
  if (quoted) i++

  for (; i < kvStr.length; i++) {
    const ch = kvStr[i]
    if (ch === '(') {
      depth++
      value += ch
    } else if (ch === ')') {
      if (depth === 0) break
      depth--
      value += ch
    } else if (ch === '"' && quoted) {
      break
    } else if (ch === ',' && depth === 0 && !quoted) {
      break
    } else {
      value += ch
    }
  }

  // Remove the fill=... segment (and its leading comma) from kvStr
  const segStart = match.index ?? 0
  // segStart is position of the leading comma (or 0 if at start)
  const segEnd = quoted ? i + 1 : i  // after closing quote/paren
  const before = kvStr.slice(0, segStart)
  const after = kvStr.slice(segEnd)
  const remaining = [before, after].filter(s => s.trim()).join(',').trim()

  return { fill: value.trim() || undefined, remaining }
}

const GLOW_VARIANTS = new Set(['outer-halo', 'inner-rim', 'fill-tint', 'combined'])
const GLOW_INTENSITIES = new Set(['subtle', 'medium', 'strong'])

function extractGlow(kvStr: string): { glow: GlowConfig | undefined; remaining: string } {
  const match = kvStr.match(/(?:^|,)\s*glow=([^,]+)/)
  if (!match) return { glow: undefined, remaining: kvStr }

  const rawValue = match[1].trim()
  const parts = rawValue.split(/\s+/)

  let color: string | undefined
  let variant: GlowConfig['variant'] | undefined
  let intensity: GlowConfig['intensity'] = 'medium'

  for (const part of parts) {
    if (GLOW_VARIANTS.has(part)) {
      variant = part as GlowConfig['variant']
    } else if (GLOW_INTENSITIES.has(part)) {
      intensity = part as GlowConfig['intensity']
    } else if (part.startsWith('#') || part.startsWith('rgb')) {
      color = part
    }
  }

  if (!variant) return { glow: undefined, remaining: kvStr }

  const glow: GlowConfig = { variant, intensity }
  if (color) glow.color = color

  // Remove the glow=... segment from kvStr
  const segStart = match.index ?? 0
  const segEnd = segStart + match[0].length
  const before = kvStr.slice(0, segStart)
  const after = kvStr.slice(segEnd)
  const remaining = [before, after].filter(s => s.trim()).join(',').trim()

  return { glow, remaining }
}

function parseLine(raw: string): StyleEntry | null {
  const line = raw.trim()
  if (!line) return null
  const colonIdx = line.indexOf(':')
  if (colonIdx === -1) return null
  const nodeId = line.slice(0, colonIdx).trim()
  if (!nodeId) return null
  const kvStr = line.slice(colonIdx + 1).trim()
  const { fill, remaining: afterFill } = extractFill(kvStr)
  const { glow, remaining: afterGlow } = extractGlow(afterFill)
  const kv = parseKv(afterGlow)
  const entry: StyleEntry = { nodeId }
  if (kv['outline']) entry.outline = kv['outline']
  if (kv['sublabel']) entry.sublabel = kv['sublabel']
  if (kv['color']) entry.color = kv['color']
  if (kv['font-weight']) entry.fontWeight = kv['font-weight']
  if (kv['font-size']) entry.fontSize = kv['font-size']
  const rawTextGlow = kv['text-glow']
  if (rawTextGlow === 'subtle' || rawTextGlow === 'medium' || rawTextGlow === 'strong') {
    entry.textGlow = rawTextGlow
  }
  if (fill) entry.fill = fill
  if (glow) entry.glow = glow
  if (Object.keys(entry).length > 1) return entry
  return null
}

export function parseStyleBlock(lines: string[]): ParsedStyleBlock {
  const base: StyleEntry[] = []
  const light: StyleEntry[] = []
  const dark: StyleEntry[] = []
  let currentSection: 'base' | 'light' | 'dark' = 'base'

  for (const raw of lines) {
    const lineEnd = raw.trimEnd()
    if (!lineEnd.trim()) continue

    const isIndented = lineEnd.length > 0 && (lineEnd[0] === ' ' || lineEnd[0] === '\t')

    if (!isIndented) {
      const trimmed = lineEnd.trim().toLowerCase()
      if (trimmed === 'light:') {
        currentSection = 'light'
        continue
      } else if (trimmed === 'dark:') {
        currentSection = 'dark'
        continue
      } else {
        // Any other unindented non-empty line is a base entry; reset section
        currentSection = 'base'
        const entry = parseLine(lineEnd)
        if (entry) base.push(entry)
        continue
      }
    }

    // Indented line — strip one level of indentation
    const stripped = lineEnd.slice(1)
    if (currentSection === 'base') continue
    const entry = parseLine(stripped)
    if (!entry) continue
    if (currentSection === 'light') light.push(entry)
    else dark.push(entry)
  }

  return { base, light, dark }
}
