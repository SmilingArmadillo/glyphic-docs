import { parseKv } from './parseKv'
import type {
  MetaBlockWarning,
  SimulateConfig,
  SimulateNodeConfig,
  SimulatePhase,
  SimulateQueueConfig,
} from './types'

export function parseSimulateBlock(
  lines: string[],
): { config: SimulateConfig; warnings: MetaBlockWarning[] } {
  const warnings: MetaBlockWarning[] = []
  const nodes: SimulateNodeConfig[] = []
  let defaultRps = 0
  let inPhasesSection = false
  const phases: SimulatePhase[] = []
  let queueConfig: SimulateQueueConfig | null = null

  let isLegacy = false
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.includes('pattern=')) {
      isLegacy = true
    }
    break
  }

  if (isLegacy) {
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue

      if (line.includes('=') && !line.includes(':')) {
        const kv = parseKv(line)
        const rawPattern = kv['pattern'] ?? ''
        const phaseType: SimulatePhase['type'] =
          rawPattern === 'steady' || rawPattern === 'burst' || rawPattern === 'spike'
            ? rawPattern
            : 'steady'
        if (!['steady', 'burst', 'spike'].includes(rawPattern)) {
          warnings.push({
            kind: 'malformed-simulate-line',
            message: `Unknown @simulate pattern "${rawPattern}" — falling back to "steady"`,
            line: rawLine,
          })
        }
        const rawRps = parseInt(kv['rps'] ?? '0', 10)
        const rps = isNaN(rawRps) || rawRps <= 0 ? 1000 : rawRps
        const rawDur = (kv['duration'] ?? '0').replace(/s$/, '')
        const dur = parseFloat(rawDur)
        const duration = isNaN(dur) || dur <= 0 ? 30 : dur
        defaultRps = rps
        phases.push({ type: phaseType, duration, rps, burstDuty: 0.3 })
        continue
      }

      const colonIdx = line.indexOf(':')
      if (colonIdx !== -1) {
        const nodeId = line.slice(0, colonIdx).trim()
        const rest = line.slice(colonIdx + 1).trim()
        const threshMatch = rest.match(/stress-threshold=(\d+)/)
        if (nodeId && threshMatch) {
          nodes.push({ nodeId, stressThreshold: parseInt(threshMatch[1], 10) })
        }
      }
    }

    return {
      config: {
        defaultRps,
        phases,
        queueConfig: { capacity: null, drainRate: defaultRps * 0.6 },
        nodes,
      },
      warnings,
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    if (line === 'phases:') {
      inPhasesSection = true
      continue
    }

    if (inPhasesSection) {
      const nodeColonIdx = line.indexOf(':')
      if (nodeColonIdx !== -1) {
        const possibleNodeId = line.slice(0, nodeColonIdx).trim()
        const possibleRest = line.slice(nodeColonIdx + 1).trim()
        const threshMatch = possibleRest.match(/stress-threshold=(\d+)/)
        if (possibleNodeId && threshMatch) {
          nodes.push({ nodeId: possibleNodeId, stressThreshold: parseInt(threshMatch[1], 10) })
          continue
        }
      }

      const colonIdx = line.indexOf(':')
      if (colonIdx === -1) continue
      const typeStr = line.slice(0, colonIdx).trim().toLowerCase()
      if (typeStr !== 'steady' && typeStr !== 'spike' && typeStr !== 'burst') {
        warnings.push({
          kind: 'malformed-simulate-line',
          message: `Unknown phase type "${typeStr}" — falling back to "steady"`,
          line: rawLine,
        })
      }
      const phaseType: SimulatePhase['type'] =
        typeStr === 'steady' || typeStr === 'spike' || typeStr === 'burst'
          ? typeStr
          : 'steady'

      const kvStr = line.slice(colonIdx + 1).trim()
      const kv = parseKv(kvStr)

      const rawDur = (kv['duration'] ?? '0').replace(/s$/, '')
      const dur = parseFloat(rawDur)
      if (isNaN(dur) || dur <= 0) {
        warnings.push({
          kind: 'malformed-simulate-line',
          message: `Phase "${typeStr}" has missing or zero duration — skipped`,
          line: rawLine,
        })
        continue
      }

      let phaseRps = defaultRps
      if (kv['rps'] !== undefined) {
        const r = parseInt(kv['rps'], 10)
        phaseRps = isNaN(r) || r <= 0 ? defaultRps : r
      }

      let burstDuty = 0.3
      if (kv['burst-duty'] !== undefined) {
        const raw = kv['burst-duty'].replace(/%$/, '')
        const parsed = parseFloat(raw)
        const asDecimal = kv['burst-duty'].includes('%') ? parsed / 100 : parsed
        if (isNaN(asDecimal) || asDecimal < 0.01 || asDecimal > 0.99) {
          warnings.push({
            kind: 'malformed-simulate-line',
            message: `burst-duty "${kv['burst-duty']}" out of range [0.01, 0.99] — clamped`,
            line: rawLine,
          })
          burstDuty = Math.min(0.99, Math.max(0.01, isNaN(asDecimal) ? 0.3 : asDecimal))
        } else {
          burstDuty = asDecimal
        }
      }

      phases.push({ type: phaseType, duration: dur, rps: phaseRps, burstDuty })
      continue
    }

    if (line.startsWith('queue:')) {
      const kvStr = line.slice('queue:'.length).trim()
      const kv = parseKv(kvStr)
      const rawCap = kv['capacity']
      const capacity = rawCap !== undefined ? parseInt(rawCap, 10) : null
      const rawDrain = kv['drain-rate']
      const drainRate = rawDrain !== undefined ? parseInt(rawDrain, 10) : null
      queueConfig = {
        capacity: capacity !== null && !isNaN(capacity) && capacity > 0 ? capacity : null,
        drainRate: drainRate !== null && !isNaN(drainRate) && drainRate > 0 ? drainRate : 0,
      }
      continue
    }

    if (line.includes('=') && !line.includes(':')) {
      const kv = parseKv(line)
      if (kv['rps'] !== undefined) {
        const r = parseInt(kv['rps'], 10)
        defaultRps = isNaN(r) || r <= 0 ? 1000 : r
      }
      continue
    }

    const colonIdx = line.indexOf(':')
    if (colonIdx !== -1) {
      const nodeId = line.slice(0, colonIdx).trim()
      const rest = line.slice(colonIdx + 1).trim()
      const threshMatch = rest.match(/stress-threshold=(\d+)/)
      if (nodeId && threshMatch) {
        nodes.push({ nodeId, stressThreshold: parseInt(threshMatch[1], 10) })
      }
    }
  }

  for (const phase of phases) {
    if (phase.rps === 0) {
      if (defaultRps === 0) {
        warnings.push({
          kind: 'malformed-simulate-line',
          message: `Phase "${phase.type}" has no rps and no global rps= — defaulting to 1000`,
          line: '',
        })
        phase.rps = 1000
      } else {
        phase.rps = defaultRps
      }
    }
  }

  if (phases.length === 0) {
    warnings.push({
      kind: 'malformed-simulate-line',
      message: 'No valid phases found in @simulate block — using steady/30s fallback',
      line: '',
    })
    const fallbackRps = defaultRps > 0 ? defaultRps : 1000
    phases.push({ type: 'steady', duration: 30, rps: fallbackRps, burstDuty: 0.3 })
  }

  if (defaultRps === 0) defaultRps = phases[0].rps

  if (queueConfig === null) {
    queueConfig = { capacity: null, drainRate: defaultRps * 0.6 }
  } else if (queueConfig.drainRate === 0) {
    queueConfig = { ...queueConfig, drainRate: defaultRps * 0.6 }
  }

  return { config: { defaultRps, phases, queueConfig, nodes }, warnings }
}
