import { parseKv } from './parseKv'
import type {
  StatusDotEntry,
  StatusDotLegendConfig,
  StatusDotPosition,
  StatusDotStyle,
  StatusLegendPosition,
} from './types'

const VALID_DOT_STYLES = new Set<string>(['breathe', 'blink', 'sonar', 'ripple'])
const VALID_DOT_POSITIONS = new Set<string>(['left', 'right', 'top-left', 'top-right', 'top-center', 'left-inset', 'center'])
const VALID_LEGEND_POSITIONS = new Set<string>([
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-right',
  'below-left', 'below-center', 'below-right',
])

export function parseStatusDotBlock(
  lines: string[],
): { entries: StatusDotEntry[]; legendConfig: StatusDotLegendConfig | null } {
  const entries: StatusDotEntry[] = []
  let legendConfig: StatusDotLegendConfig | null = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const nodeId = line.slice(0, colonIdx).trim()
    if (!nodeId) continue

    const kvStr = line.slice(colonIdx + 1).trim()
    const kv = parseKv(kvStr)

    if (nodeId.toLowerCase() === 'legend dot') {
      const pos = kv['position']
      if (pos && VALID_LEGEND_POSITIONS.has(pos)) {
        const padding = kv['padding'] !== undefined ? parseInt(kv['padding'], 10) : 12
        legendConfig = {
          position: pos as StatusLegendPosition,
          padding: isNaN(padding) ? 12 : padding,
        }
      }
      continue
    }

    if (kv['type'] !== 'status-dot') continue

    const rawStyle = kv['style'] ?? 'breathe'
    const style: StatusDotStyle = VALID_DOT_STYLES.has(rawStyle)
      ? (rawStyle as StatusDotStyle)
      : 'breathe'

    const rawPosition = kv['position'] ?? 'left'
    const position: StatusDotPosition = VALID_DOT_POSITIONS.has(rawPosition)
      ? (rawPosition as StatusDotPosition)
      : 'left'

    const size = kv['size'] !== undefined ? parseFloat(kv['size']) : 10
    const speed = kv['speed'] !== undefined ? parseFloat(kv['speed']) : 2
    const rawRipple = kv['rippleCount'] !== undefined ? parseInt(kv['rippleCount'], 10) : 1
    const rippleCount = Math.min(3, Math.max(1, isNaN(rawRipple) ? 1 : rawRipple))

    const entry: StatusDotEntry = {
      nodeId,
      style,
      color: kv['color'] ?? '#3b82f6',
      position,
      size: isNaN(size) || size <= 0 ? 10 : size,
      speed: isNaN(speed) || speed <= 0 ? 2 : speed,
      rippleCount,
    }
    if (kv['label']) {
      entry.label = kv['label'].replace(/^["']|["']$/g, '')
    }
    entries.push(entry)
  }

  return { entries, legendConfig }
}
