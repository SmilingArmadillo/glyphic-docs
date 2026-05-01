import type { StatusEntry, HealthState, MetaBlockWarning } from './types'

const VALID_STATES = new Set<string>(['healthy', 'degraded', 'down'])
const QUOTED_PARAM_RE = /(?:^|\s)(name|label)="([^"]*)"/g

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

export function parseStatusBlock(
  lines: string[],
): { entries: StatusEntry[]; warnings: MetaBlockWarning[] } {
  const entries: StatusEntry[] = []
  const warnings: MetaBlockWarning[] = []
  const seen = new Set<string>()

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const nodeId = line.slice(0, colonIdx).trim()
    const rhs = line.slice(colonIdx + 1).trim()
    if (!nodeId || !rhs) continue

    const stateMatch = rhs.match(/(?:^|\s)state=(\w+)/)
    if (!stateMatch) continue

    const stateKey = stateMatch[1].toLowerCase()
    if (!VALID_STATES.has(stateKey)) continue

    const key = nodeId.toLowerCase()
    if (seen.has(key)) {
      warnings.push({
        kind: 'duplicate-status',
        message: `Duplicate @status entry for '${nodeId}' — first entry used`,
        line: raw,
      })
      continue
    }
    seen.add(key)

    const { name, label } = extractQuotedParams(rhs)

    entries.push({
      nodeId,
      state: stateKey as HealthState,
      ...(name ? { name } : {}),
      ...(label ? { label } : {}),
    })
  }

  return { entries, warnings }
}
