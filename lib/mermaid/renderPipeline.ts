import mermaid from 'mermaid'
import type { DiagramOpacity, AnimationConfig, DotAnimationConfig, LineFlowConfig, PillFlowConfig } from './style'
import { injectFlowAnimations } from './injectFlowAnimations'
import { injectLineFlowAnimations } from './injectLineFlowAnimations'
import { injectOpacity } from './injectOpacity'
import { normalizeNodeId } from './parseMetaBlocks'
import type { MetaBlockWarning, PresentEntry, SimulateConfig, AnimateEntry, StyleEntry, StatusDotEntry, ThemeConfig } from './parseMetaBlocks'
import { resolveTokens } from './parseMetaBlocks'
// SimulationState inlined here (from useSimulation) to avoid hook dependency
export interface SimulationState {
  currentRps: number
  phase: 'steady' | 'burst' | 'spike'
  activePhaseIndex: number
  queueDepth: number
  stressedNodes: Set<string>
}
import { injectPresentationOverlays } from './injectPresentationOverlays'
import { injectNodePulseAnimations } from './injectNodePulseAnimations'
import { injectNodeDecorations } from './injectNodeDecorations'
import { injectPillFlowAnimations } from './injectPillFlowAnimations'
import { injectStyleOverrides } from './injectStyleOverrides'
import { injectGradientFills } from './injectGradientFills'
import { injectNodeGlow } from './injectNodeGlow'
import { injectNodeBadges } from './injectNodeBadges'
import type { BadgeEntry } from './parseMetaBlocks'
import { injectStatusDots } from './injectStatusDots'
import { sanitizeSvgString } from './parseSvgDoc'
import { injectEdgeLabels } from './injectEdgeLabels'
import { injectIconLabels } from './injectIconLabels'
import { injectSublabels } from './injectSublabels'

function buildSimulationOverrides(
  simulationState: SimulationState,
): {
  stressPresentEntries: PresentEntry[]
  stressAnimateEntries: AnimateEntry[]
} {
  const stressPresentEntries: PresentEntry[] = []
  const stressAnimateEntries: AnimateEntry[] = []

  const phaseLabel =
    simulationState.phase === 'spike' ? 'SPIKE'
    : simulationState.phase === 'burst' ? 'BURST'
    : 'STRESSED'

  for (const nodeId of simulationState.stressedNodes) {
    stressPresentEntries.push({
      kind: 'overlay',
      position: 'attached',
      target: nodeId,
      text: phaseLabel,
      color: '#f97316',
    })
    stressAnimateEntries.push({
      kind: 'node',
      nodeId,
      type: 'node-pulse',
      pulseStyle: 'border',
      color: '#ef4444',
      speed: 0.8,
    })
  }

  return { stressPresentEntries, stressAnimateEntries }
}

function injectRankSpacing(mmd: string, spacing: number): string {
  const initRegex = /%%\{init:\s*(\{[\s\S]*?\})\s*\}%%/
  const match = mmd.match(initRegex)
  if (match) {
    try {
      const config = JSON.parse(match[1])
      const flowchart = config.flowchart ?? {}
      if ((flowchart.rankSpacing ?? 0) >= spacing) return mmd
      config.flowchart = { ...flowchart, rankSpacing: spacing }
      return mmd.replace(initRegex, `%%{init: ${JSON.stringify(config)}}%%`)
    } catch {
      return mmd
    }
  }
  return `%%{init: {"flowchart": {"rankSpacing": ${spacing}}}}%%\n` + mmd
}

export async function runRenderPipeline(
  cleanMmd: string,
  animateEntries: AnimateEntry[],
  presentEntries: PresentEntry[],
  styleEntries: StyleEntry[],
  statusDotEntries: StatusDotEntry[],
  animationConfig: AnimationConfig,
  opacity: DiagramOpacity,
  renderId: number,
  idSuffix: string,
  simulationState: SimulationState | null,
  simulateConfig: SimulateConfig | null,
  animationSpeedScale: number,
  themeConfig: ThemeConfig | null,
  background: 'light' | 'dark',
  styleEntriesLight: StyleEntry[],
  styleEntriesDark: StyleEntry[],
  badgeEntries: BadgeEntry[],
): Promise<{ svg: string; presentEntries: PresentEntry[]; warnings: MetaBlockWarning[] }> {
  const container = document.createElement('div')
  container.id = `mermaid-render-target-${renderId}-${idSuffix}`
  container.style.position = 'fixed'
  container.style.top = '-9999px'
  container.style.left = '-9999px'
  document.body.appendChild(container)

  const allWarnings: MetaBlockWarning[] = []

  // Resolve @theme color tokens before injectors run
  const resolvedAnimateEntries = themeConfig
    ? animateEntries.map(e => resolveTokens(e, themeConfig, background))
    : animateEntries
  const resolvedStyleEntries = themeConfig
    ? styleEntries.map(e => resolveTokens(e, themeConfig, background))
    : styleEntries
  const themedEntries = background === 'light' ? styleEntriesLight : styleEntriesDark
  const styleMap = new Map<string, StyleEntry>()
  for (const e of resolvedStyleEntries) styleMap.set(e.nodeId, e)
  for (const e of themedEntries) {
    const resolved = themeConfig ? resolveTokens(e, themeConfig, background) : e
    styleMap.set(e.nodeId, resolved)
  }
  const finalStyleEntries = Array.from(styleMap.values())
  const resolvedPresentEntries = themeConfig
    ? presentEntries.map(e => resolveTokens(e, themeConfig, background))
    : presentEntries
  const resolvedBadgeEntries = themeConfig
    ? badgeEntries.map(e => resolveTokens(e, themeConfig, background))
    : badgeEntries

  // When badges + edge labels coexist, increase rank spacing so pills don't collide with badges
  const hasBadgesAndLabels = resolvedBadgeEntries.length > 0 &&
    resolvedAnimateEntries.some(e => e.kind === 'edge' && e.edgeLabel)
  const mmdToRender = hasBadgesAndLabels
    ? injectRankSpacing(cleanMmd, 100)
    : cleanMmd

  try {
    const { svg: rawSvg } = await mermaid.render(
      `mermaid-svg-${Date.now()}-${renderId}-${idSuffix}`,
      mmdToRender,
      container
    )
    const svg = sanitizeSvgString(rawSvg)

    const dotOverrides = new Map<string, Partial<DotAnimationConfig>>()
    const lineFlowOverrides = new Map<string, Partial<LineFlowConfig>>()
    const pillOverrides = new Map<string, Partial<PillFlowConfig>>()
    const dotSkip = new Set<string>()
    const lineFlowSkip = new Set<string>()

    for (const entry of resolvedAnimateEntries) {
      if (entry.kind !== 'edge' || !entry.from || !entry.to) continue
      const key = `${normalizeNodeId(entry.from)}-->${normalizeNodeId(entry.to)}`

      if (entry.type === 'dot') {
        lineFlowSkip.add(key)
        const override: Partial<DotAnimationConfig> = {}
        if (entry.color !== undefined) override.color = entry.color
        if (entry.speed !== undefined) override.speed = entry.speed
        if (entry.particleCount !== undefined) override.particleCount = entry.particleCount
        dotOverrides.set(key, override)
      } else if (entry.type === 'line-flow') {
        dotSkip.add(key)
        const override: Partial<LineFlowConfig> = {}
        if (entry.color !== undefined) override.color = entry.color
        if (entry.speed !== undefined) override.speed = entry.speed
        if (entry.preset !== undefined) override.motionPreset = entry.preset
        if (entry.glow !== undefined) override.glowPreset = entry.glow
        if (entry.particleCount !== undefined) override.particleCount = entry.particleCount
        lineFlowOverrides.set(key, override)
      } else if (entry.type === 'pill') {
        const override: Partial<PillFlowConfig> = {}
        if (entry.color !== undefined) override.color = entry.color
        if (entry.speed !== undefined) override.speed = entry.speed
        if (entry.glow !== undefined) override.glowPreset = entry.glow
        if (entry.pillWidth !== undefined) override.width = entry.pillWidth
        if (entry.pillHeight !== undefined) override.height = entry.pillHeight
        if (entry.particleCount !== undefined) override.particleCount = entry.particleCount
        pillOverrides.set(key, override)
      }
    }

    let effectiveAnimateEntries = resolvedAnimateEntries
    let effectivePresentEntries = resolvedPresentEntries
    if (simulationState !== null && simulateConfig !== null) {
      const { stressPresentEntries, stressAnimateEntries } =
        buildSimulationOverrides(simulationState)

      const explicitNodeIds = new Set(
        resolvedAnimateEntries.filter(e => e.kind === 'node').map(e => e.nodeId)
      )
      const filteredStressAnimate = stressAnimateEntries.filter(
        e => !explicitNodeIds.has(e.nodeId)
      )
      effectiveAnimateEntries = [...resolvedAnimateEntries, ...filteredStressAnimate]
      effectivePresentEntries = [...resolvedPresentEntries, ...stressPresentEntries]
    }

    const scaledDotConfig: DotAnimationConfig = animationSpeedScale !== 1
      ? { ...animationConfig.dot, speed: animationConfig.dot.speed / animationSpeedScale }
      : animationConfig.dot
    const scaledLineFlowConfig: LineFlowConfig = animationSpeedScale !== 1
      ? { ...animationConfig.lineFlow, speed: animationConfig.lineFlow.speed / animationSpeedScale }
      : animationConfig.lineFlow
    const scaledPillConfig: PillFlowConfig = animationSpeedScale !== 1
      ? { ...animationConfig.pill, speed: animationConfig.pill.speed / animationSpeedScale }
      : animationConfig.pill
    if (animationSpeedScale !== 1) {
      for (const [key, override] of dotOverrides) {
        if (override.speed !== undefined) dotOverrides.set(key, { ...override, speed: override.speed / animationSpeedScale })
      }
      for (const [key, override] of lineFlowOverrides) {
        if (override.speed !== undefined) lineFlowOverrides.set(key, { ...override, speed: override.speed / animationSpeedScale })
      }
      for (const [key, override] of pillOverrides) {
        if (override.speed !== undefined) pillOverrides.set(key, { ...override, speed: override.speed / animationSpeedScale })
      }
    }

    if (false) console.groupCollapsed(`[mermaid-studio] render pipeline — ${idSuffix}`)

    const dotResult = injectFlowAnimations(svg, scaledDotConfig, dotOverrides, dotSkip)
    let finalSvg = dotResult.svg
    if (false) console.debug('[dot]     overrides:', [...dotOverrides.keys()], 'unmatched:', dotResult.unmatched)
    allWarnings.push(...dotResult.unmatched.map(key => ({
      kind: 'unmatched-animate-edge' as const,
      message: `No SVG path found for '${key}' in @animate — check node IDs match your diagram`,
      line: key,
    })))

    const lineFlowResult = injectLineFlowAnimations(finalSvg, scaledLineFlowConfig, lineFlowOverrides, lineFlowSkip)
    finalSvg = lineFlowResult.svg
    if (false) console.debug('[line-flow] overrides:', [...lineFlowOverrides.keys()], 'unmatched:', lineFlowResult.unmatched)
    allWarnings.push(...lineFlowResult.unmatched.map(key => ({
      kind: 'unmatched-animate-edge' as const,
      message: `No SVG path found for '${key}' in @animate — check node IDs match your diagram`,
      line: key,
    })))

    const pillResult = injectPillFlowAnimations(finalSvg, scaledPillConfig, pillOverrides)
    finalSvg = pillResult.svg
    if (false) console.debug('[pill]    overrides:', [...pillOverrides.keys()], 'unmatched:', pillResult.unmatched)
    allWarnings.push(...pillResult.unmatched.map(key => ({
      kind: 'unmatched-animate-edge' as const,
      message: `No SVG path found for '${key}' in @animate — check node IDs match your diagram`,
      line: key,
    })))

    const edgeLabelResult = injectEdgeLabels(finalSvg, resolvedAnimateEntries, resolvedBadgeEntries)
    finalSvg = edgeLabelResult.svg
    if (false) console.debug('[edge-label] unmatched:', edgeLabelResult.unmatched)
    allWarnings.push(...edgeLabelResult.unmatched.map(key => ({
      kind: 'unmatched-animate-edge' as const,
      message: `No SVG path found for edge label '${key}' in @animate — check node IDs match your diagram`,
      line: key,
    })))

    const nodePulseEntries = effectiveAnimateEntries.filter(e => e.kind === 'node' && e.type === 'node-pulse')
    if (false) console.debug('[node-pulse] entries:', nodePulseEntries.map(e => `${e.nodeId}(${e.pulseStyle ?? 'border'})`))
    const nodePulseResult = injectNodePulseAnimations(finalSvg, nodePulseEntries)
    finalSvg = nodePulseResult.svg
    if (false) console.debug('[node-pulse] unmatched:', nodePulseResult.unmatched)
    allWarnings.push(...nodePulseResult.unmatched.map(nodeId => ({
      kind: 'unmatched-animate-node' as const,
      message: `No SVG node found for '@animate ${nodeId}' — check node IDs match your diagram`,
      line: nodeId,
    })))

    const ovalInsetEntries = effectiveAnimateEntries.filter(e => e.kind === 'node' && e.type === 'oval-inset')
    if (false) console.debug('[oval-inset] entries:', ovalInsetEntries.map(e => e.nodeId))
    const nodeDecorationResult = injectNodeDecorations(finalSvg, ovalInsetEntries)
    finalSvg = nodeDecorationResult.svg
    if (false) console.debug('[oval-inset] unmatched:', nodeDecorationResult.unmatched)
    allWarnings.push(...nodeDecorationResult.unmatched.map(nodeId => ({
      kind: 'unmatched-animate-node' as const,
      message: `No SVG node found for '@animate ${nodeId}' (oval-inset) — check node IDs match your diagram`,
      line: nodeId,
    })))

    if (false) console.debug('[style]   entries:', finalStyleEntries.map(e => `${e.nodeId}(outline=${e.outline})`))
    const styleResult = injectStyleOverrides(finalSvg, finalStyleEntries)
    finalSvg = styleResult.svg
    if (false) console.debug('[style]   unmatched:', styleResult.unmatched)
    allWarnings.push(...styleResult.unmatched.map(nodeId => ({
      kind: 'unmatched-style-node' as const,
      message: `No SVG node found for '@style ${nodeId}' — check node IDs match your diagram`,
      line: nodeId,
    })))

    if (false) console.debug('[gradient-fill] entries:', finalStyleEntries.filter(e => e.fill).map(e => `${e.nodeId}(${e.fill})`))
    const gradientFillResult = injectGradientFills(finalSvg, finalStyleEntries)
    finalSvg = gradientFillResult.svg
    if (false) console.debug('[gradient-fill] unmatched:', gradientFillResult.unmatched)
    allWarnings.push(...gradientFillResult.unmatched.map(nodeId => ({
      kind: 'unmatched-style-node' as const,
      message: `No SVG node found for '@style ${nodeId}' fill — check node IDs match your diagram`,
      line: nodeId,
    })))

    if (false) console.debug('[node-glow] entries:', finalStyleEntries.filter(e => e.glow).map(e => `${e.nodeId}(${e.glow!.variant},${e.glow!.intensity})`))
    const nodeGlowResult = injectNodeGlow(finalSvg, finalStyleEntries)
    finalSvg = nodeGlowResult.svg
    if (false) console.debug('[node-glow] unmatched:', nodeGlowResult.unmatched)
    allWarnings.push(...nodeGlowResult.unmatched.map(nodeId => ({
      kind: 'unmatched-style-node' as const,
      message: `No SVG node found for '@style ${nodeId}' glow — check node IDs match your diagram`,
      line: nodeId,
    })))

    finalSvg = injectIconLabels(finalSvg)
    if (false) console.debug('[icon-label] done')

    const sublabelResult = injectSublabels(finalSvg, finalStyleEntries)
    finalSvg = sublabelResult.svg
    if (false) console.debug('[sublabel] unmatched:', sublabelResult.unmatched)
    allWarnings.push(...sublabelResult.unmatched.map(nodeId => ({
      kind: 'unmatched-style-node' as const,
      message: `No SVG node found for '@style ${nodeId}' sublabel — check node IDs match your diagram`,
      line: nodeId,
    })))

    if (false) console.debug('[status-dot] entries:', statusDotEntries.map(e => `${e.nodeId}(${e.style})`))
    const statusDotResult = injectStatusDots(finalSvg, statusDotEntries)
    finalSvg = statusDotResult.svg
    if (false) console.debug('[status-dot] unmatched:', statusDotResult.unmatched)
    allWarnings.push(...statusDotResult.unmatched.map(nodeId => ({
      kind: 'unmatched-animate-node' as const,
      message: `No SVG node found for '@animate ${nodeId}' (status-dot) — check node IDs match your diagram`,
      line: nodeId,
    })))

    if (false) console.debug('[present] entries:', effectivePresentEntries.map(e => `${e.kind}:${e.target ?? ''}`))
    const presentResult = injectPresentationOverlays(finalSvg, effectivePresentEntries)
    finalSvg = presentResult.svg
    if (false) console.debug('[present] unmatched:', presentResult.unmatched)
    allWarnings.push(...presentResult.unmatched.map(target => ({
      kind: 'unmatched-present-badge' as const,
      message: `No SVG node found for '@present badge ${target}' — check node IDs match your diagram`,
      line: target,
    })))

    const nodeBadgeResult = injectNodeBadges(finalSvg, resolvedBadgeEntries)
    finalSvg = nodeBadgeResult.svg
    if (false) console.debug('[node-badge] unmatched:', nodeBadgeResult.unmatched)
    allWarnings.push(...nodeBadgeResult.unmatched.map(nodeId => ({
      kind: 'unmatched-badge' as const,
      message: `No SVG node found for '@badge ${nodeId}' — check node IDs match your diagram`,
      line: nodeId,
    })))

    if (false) console.groupEnd()

    finalSvg = injectOpacity(finalSvg, opacity)

    return { svg: finalSvg, presentEntries: effectivePresentEntries, warnings: allWarnings }
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }
}
