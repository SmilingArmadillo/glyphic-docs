import { parseKv } from './parseKv'
import { parseStatusDotBlock } from './parseStatusDot'
import type {
  AnimateEntry,
  MetaBlockWarning,
  StatusDotEntry,
  StatusDotLegendConfig,
} from './types'

export function parseAnimateLine(
  raw: string,
): { entry: AnimateEntry; warning?: MetaBlockWarning } | { entry: null; warning: MetaBlockWarning } {
  const line = raw.trim()
  if (!line) return { entry: null, warning: { kind: 'malformed-animate-line', message: 'Empty line', line: raw } }

  if (line.includes('-->')) {
    const arrowIdx = line.indexOf('-->')
    const from = line.slice(0, arrowIdx).trim()
    const rest = line.slice(arrowIdx + 3)
    const colonIdx = rest.indexOf(':')
    if (colonIdx === -1 || !from) {
      return { entry: null, warning: { kind: 'malformed-animate-line', message: `Malformed edge animate line: "${line}"`, line: raw } }
    }
    const to = rest.slice(0, colonIdx).trim()
    const kvStr = rest.slice(colonIdx + 1).trim()
    const kv = parseKv(kvStr)

    const type = (kv['type'] as AnimateEntry['type']) ?? 'line-flow'
    const entry: AnimateEntry = { kind: 'edge', from, to, type }
    if (kv['color']) entry.color = kv['color']
    if (kv['speed'] !== undefined) {
      const spd = parseFloat(kv['speed'])
      if (!isNaN(spd)) entry.speed = spd
    }
    if (kv['preset']) entry.preset = kv['preset'] as AnimateEntry['preset']
    if (kv['glow']) entry.glow = kv['glow'] as AnimateEntry['glow']
    if (kv['width'] !== undefined) {
      const w = parseFloat(kv['width'])
      if (!isNaN(w) && w > 0) entry.pillWidth = w
    }
    if (kv['height'] !== undefined) {
      const h = parseFloat(kv['height'])
      if (!isNaN(h) && h > 0) entry.pillHeight = h
    }
    if (kv['pulseStyle']) entry.pulseStyle = kv['pulseStyle'] as AnimateEntry['pulseStyle']
    if (kv['label']) entry.edgeLabel = kv['label']
    if (kv['particle-count'] !== undefined) {
      const pc = parseInt(kv['particle-count'], 10)
      if (!isNaN(pc) && pc >= 1) entry.particleCount = Math.min(10, pc)
    }
    return { entry }
  } else {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) {
      return { entry: null, warning: { kind: 'malformed-animate-line', message: `Malformed animate line (no --> or :): "${line}"`, line: raw } }
    }
    const nodeId = line.slice(0, colonIdx).trim()
    if (!nodeId) {
      return { entry: null, warning: { kind: 'malformed-animate-line', message: `Malformed node animate line (empty nodeId): "${line}"`, line: raw } }
    }
    const kvStr = line.slice(colonIdx + 1).trim()
    const kv = parseKv(kvStr)

    const type = (kv['type'] as AnimateEntry['type']) ?? 'node-pulse'
    const entry: AnimateEntry = { kind: 'node', nodeId, type }
    if (kv['color']) entry.color = kv['color']
    if (kv['speed'] !== undefined) {
      const spd = parseFloat(kv['speed'])
      if (!isNaN(spd)) entry.speed = spd
    }
    if (kv['pulseStyle']) entry.pulseStyle = kv['pulseStyle'] as AnimateEntry['pulseStyle']
    if (kv['rippleCount'] !== undefined) {
      const rc = parseInt(kv['rippleCount'], 10)
      if (!isNaN(rc)) {
        entry.rippleCount = Math.min(3, Math.max(1, rc))
      }
    }
    if (kv['intensity'] === 'low' || kv['intensity'] === 'medium' || kv['intensity'] === 'high') {
      entry.intensity = kv['intensity']
    }
    return { entry }
  }
}

export function parseAnimateBlock(lines: string[]): {
  entries: AnimateEntry[]
  statusDotEntries: StatusDotEntry[]
  statusDotLegendConfig: StatusDotLegendConfig | null
  warnings: MetaBlockWarning[]
} {
  const statusDotLines: string[] = []
  const regularLines: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line.toLowerCase().startsWith('legend dot:')) {
      statusDotLines.push(rawLine)
      continue
    }
    const colonIdx = line.indexOf(':')
    if (colonIdx !== -1 && !line.includes('-->')) {
      const kvStr = line.slice(colonIdx + 1).trim()
      const kv = parseKv(kvStr)
      if (kv['type'] === 'status-dot') {
        statusDotLines.push(rawLine)
        continue
      }
    }
    regularLines.push(rawLine)
  }

  const { entries: statusDotEntries, legendConfig: statusDotLegendConfig } =
    parseStatusDotBlock(statusDotLines)

  const entries: AnimateEntry[] = []
  const warnings: MetaBlockWarning[] = []
  const edgeIndex = new Map<string, number>()

  for (const rawLine of regularLines) {
    const line = rawLine.trim()
    if (!line) continue

    const result = parseAnimateLine(rawLine)
    if (result.entry === null) {
      warnings.push(result.warning)
      continue
    }

    const { entry } = result
    if (entry.kind === 'edge') {
      const key = `${entry.from}-->${entry.to}`
      if (edgeIndex.has(key)) {
        entries[edgeIndex.get(key)!] = entry
      } else {
        edgeIndex.set(key, entries.length)
        entries.push(entry)
      }
    } else {
      entries.push(entry)
    }
  }

  return { entries, statusDotEntries, statusDotLegendConfig, warnings }
}
