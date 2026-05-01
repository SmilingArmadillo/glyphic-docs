import type { BadgeEntry, BadgeDirection, MetaBlockWarning } from './types'

const VALID_DIRECTIONS = new Set<string>(['top', 'bottom', 'left', 'right'])

const STATE_VISUALS: Record<string, { label: string; bgColor: string }> = {
  healthy:  { label: 'HEALTHY',  bgColor: '#16a34a' },
  degraded: { label: 'DEGRADED', bgColor: '#b45309' },
  down:     { label: 'DOWN',     bgColor: '#dc2626' },
}

const PARAM_RE = /(?:^|\s)(fill|color|outline|text)=(\$[\w-]+|#[0-9a-fA-F]{3,8})/g
const QUOTED_PARAM_RE = /(?:^|\s)(name|label)="([^"]*)"/g

function extractParams(s: string): {
  fill?: string
  color?: string
  outline?: string
  text?: string
} {
  const result: { fill?: string; color?: string; outline?: string; text?: string } = {}
  let m: RegExpExecArray | null
  PARAM_RE.lastIndex = 0
  while ((m = PARAM_RE.exec(s)) !== null) {
    const key = m[1] as 'fill' | 'color' | 'outline' | 'text'
    if (!result[key]) result[key] = m[2]
  }
  return result
}

function extractQuotedParams(s: string): { name?: string; label?: string } {
  const result: { name?: string; label?: string } = {}
  let m: RegExpExecArray | null
  QUOTED_PARAM_RE.lastIndex = 0
  while ((m = QUOTED_PARAM_RE.exec(s)) !== null) {
    const key = m[1] as 'name' | 'label'
    if (!result[key]) result[key] = m[2]
  }
  return result
}

export function parseBadgeBlock(
  lines: string[],
): { entries: BadgeEntry[]; warnings: MetaBlockWarning[] } {
  const entries: BadgeEntry[] = []
  const warnings: MetaBlockWarning[] = []
  const seen = new Set<string>()

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const lhs = line.slice(0, colonIdx).trim()
    const rhs = line.slice(colonIdx + 1).trim()
    if (!lhs || !rhs) continue

    const lhsParts = lhs.split(/\s+/)
    let nodeId: string
    let direction: BadgeDirection

    if (lhsParts.length === 1) {
      nodeId = lhsParts[0]
      direction = 'top'
    } else if (lhsParts.length === 2 && VALID_DIRECTIONS.has(lhsParts[1].toLowerCase())) {
      nodeId = lhsParts[0]
      direction = lhsParts[1].toLowerCase() as BadgeDirection
    } else {
      continue
    }

    const slotKey = `${nodeId.toLowerCase()}:${direction}`
    if (seen.has(slotKey)) {
      warnings.push({
        kind: 'duplicate-badge',
        message: `Duplicate badge for '${nodeId} ${direction}' — first entry used`,
        line: raw,
      })
      continue
    }
    seen.add(slotKey)

    let label: string
    let bgColor: string

    const stateMatch = rhs.match(/^state=(\w+)/)
    let state: string | undefined
    let name: string | undefined
    let panelLabel: string | undefined

    if (stateMatch) {
      const stateKey = stateMatch[1].toLowerCase()
      const visuals = STATE_VISUALS[stateKey]
      if (!visuals) continue
      label = visuals.label
      bgColor = visuals.bgColor
      state = stateKey
      const quoted = extractQuotedParams(rhs)
      name = quoted.name
      panelLabel = quoted.label
    } else {
      const quoteStart = rhs.indexOf('"')
      const quoteEnd = rhs.indexOf('"', quoteStart + 1)
      if (quoteStart === -1 || quoteEnd === -1) continue
      label = rhs.slice(quoteStart + 1, quoteEnd)
      bgColor = '#6b7280'
    }

    const params = extractParams(rhs)
    // fill= wins over color=; both are aliases for bgColor
    if (params.fill) bgColor = params.fill
    else if (params.color) bgColor = params.color

    const textColor = params.text ?? '#ffffff'
    const outline = params.outline

    entries.push({
      nodeId, direction, label, bgColor, textColor,
      ...(outline ? { outline } : {}),
      ...(state ? { state: state as import('./types').HealthState } : {}),
      ...(name ? { name } : {}),
      ...(panelLabel ? { panelLabel } : {}),
    })
  }

  return { entries, warnings }
}
