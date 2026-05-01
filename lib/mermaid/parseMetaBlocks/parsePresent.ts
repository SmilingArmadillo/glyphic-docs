import type { PresentEntry } from './types'

export function parsePresentLine(raw: string): PresentEntry | null {
  const line = raw.trim()
  if (!line) return null

  const spaceIdx = line.indexOf(' ')
  if (spaceIdx === -1) return null
  const kindStr = line.slice(0, spaceIdx).toLowerCase()
  if (kindStr !== 'overlay') return null

  const afterKind = line.slice(spaceIdx + 1)
  const colonIdx = afterKind.indexOf(':')
  if (colonIdx === -1) return null

  const target = afterKind.slice(0, colonIdx).trim()
  const rest = afterKind.slice(colonIdx + 1).trim()

  // Extract quoted text
  const quoteStart = rest.indexOf('"')
  const quoteEnd = rest.indexOf('"', quoteStart + 1)
  if (quoteStart === -1 || quoteEnd === -1) return null

  const text = rest.slice(quoteStart + 1, quoteEnd)
  const trailing = rest.slice(quoteEnd + 1).trim()
  // @present trailing attributes are space-separated (key=value key=value),
  // unlike @animate which uses comma-separated. Parse each space token individually.
  const kv: Record<string, string> = {}
  for (const token of trailing.split(/\s+/)) {
    const eqIdx = token.indexOf('=')
    if (eqIdx === -1) continue
    const key = token.slice(0, eqIdx).trim()
    const value = token.slice(eqIdx + 1).trim()
    if (key) kv[key] = value
  }

  const defaultPosition: 'fixed' | 'attached' = 'fixed'
  const positionRaw = kv['position']
  const position: 'fixed' | 'attached' =
    positionRaw === 'fixed' || positionRaw === 'attached' ? positionRaw : defaultPosition

  const entry: PresentEntry = {
    kind: 'overlay',
    target,
    text,
    position,
  }
  if (kv['color']) entry.color = kv['color']
  if (kv['type']) entry.type = kv['type']
  return entry
}

export function parsePresentBlock(lines: string[]): PresentEntry[] {
  const entries: PresentEntry[] = []
  for (const line of lines) {
    const entry = parsePresentLine(line)
    if (entry) entries.push(entry)
  }
  return entries
}
