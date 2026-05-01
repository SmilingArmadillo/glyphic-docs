// Pure string-only utility — no DOM APIs (document, window, DOMParser, XMLSerializer).
// Must be importable and runnable in Node.js without a browser shim.

export * from './types'
export { parseKv } from './parseKv'
export { parseAnimateLine, parseAnimateBlock } from './parseAnimate'
export { parsePresentLine, parsePresentBlock } from './parsePresent'
export { parseStyleBlock } from './parseStyle'
export { parseStatusDotBlock } from './parseStatusDot'
export { parseCompareBlock } from './parseCompare'
export { parseSimulateBlock } from './parseSimulate'
export { parseTheme } from './parseTheme'
export { resolveColor, resolveTokens } from './resolveTokens'
export { parsePanelBlock } from './parsePanel'
export { parseBadgeBlock } from './parseBadge'
export { parseStatusBlock } from './parseStatusBlock'

import { parseAnimateBlock } from './parseAnimate'
import { parsePresentBlock } from './parsePresent'
import { parseStyleBlock } from './parseStyle'
import { parseCompareBlock } from './parseCompare'
import { parseSimulateBlock } from './parseSimulate'
import { parseTheme } from './parseTheme'
import { parsePanelBlock } from './parsePanel'
import { parseBadgeBlock } from './parseBadge'
import { parseStatusBlock } from './parseStatusBlock'
import type {
  AnimateEntry,
  BadgeEntry,
  CompareConfig,
  MetaBlockWarning,
  PanelSection,
  ParsedMetaBlocks,
  PresentEntry,
  SimulateConfig,
  StatusDotEntry,
  StatusDotLegendConfig,
  StatusEntry,
  StyleEntry,
  ThemeConfig,
} from './types'

export function normalizeNodeId(id: string): string {
  return id.toLowerCase().replace(/\s+/g, '')
}

interface Segment {
  keyword: string
  bodyLines: string[]
}

interface SectionParseResult {
  preambleLines: string[]
  segments: Segment[]
  unknownBlockWarnings: MetaBlockWarning[]
}

function parseSection(lines: string[]): SectionParseResult {
  const KNOWN_KEYWORDS = new Set(['animate', 'present', 'compare', 'simulate', 'style', 'badge', 'status', 'theme', 'panel'])
  const preambleLines: string[] = []
  const segments: Segment[] = []
  const unknownBlockWarnings: MetaBlockWarning[] = []

  let currentSegment: Segment | null = null
  let inBlocks = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('@')) {
      inBlocks = true
      if (currentSegment) segments.push(currentSegment)
      const rest = trimmed.slice(1).trim()
      currentSegment = { keyword: rest, bodyLines: [] }
      const baseKeyword = rest.split(/\s+/)[0].toLowerCase()
      if (!KNOWN_KEYWORDS.has(baseKeyword)) {
        unknownBlockWarnings.push({
          kind: 'unknown-block',
          message: `Unknown meta-block keyword: "@${rest}"`,
          line,
        })
      }
    } else if (inBlocks && currentSegment) {
      currentSegment.bodyLines.push(line)
    } else {
      preambleLines.push(line)
    }
  }

  if (currentSegment) segments.push(currentSegment)
  return { preambleLines, segments, unknownBlockWarnings }
}

interface InlineDirectives {
  canvasBackground: 'dark' | 'light' | null
  gridOverride: boolean | null
  warnings: MetaBlockWarning[]
  strippedLines: string[]
}

// Extract @canvas and @grid from anywhere in the source (position-independent).
// Returns their values and a copy of the lines with those directives removed.
function extractInlineDirectives(lines: string[]): InlineDirectives {
  const canvasRe = /^@canvas(\s+\S+)?$/i
  const gridRe = /^@grid(\s+\S+)?$/i
  let canvasBackground: 'dark' | 'light' | null = null
  let gridOverride: boolean | null = null
  const warnings: MetaBlockWarning[] = []
  const strippedLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    const canvasMatch = trimmed.match(canvasRe)
    const gridMatch = trimmed.match(gridRe)
    if (canvasMatch) {
      const arg = (canvasMatch[1] ?? '').trim().toLowerCase()
      if (arg === 'dark' || arg === 'light') {
        canvasBackground = arg
      } else {
        warnings.push({ kind: 'invalid-canvas-value', message: `Invalid @canvas value: "${arg}". Expected "dark" or "light".`, line: trimmed })
      }
      // strip this line — do not pass it to parseSection
    } else if (gridMatch) {
      const arg = (gridMatch[1] ?? '').trim().toLowerCase()
      if (arg === 'true') {
        gridOverride = true
      } else if (arg === 'false') {
        gridOverride = false
      } else {
        warnings.push({ kind: 'invalid-grid-value', message: `Invalid @grid value: "${arg}". Expected "true" or "false".`, line: trimmed })
      }
      // strip this line — do not pass it to parseSection
    } else {
      strippedLines.push(line)
    }
  }

  return { canvasBackground, gridOverride, warnings, strippedLines }
}

export function parseMetaBlocks(source: string): ParsedMetaBlocks {
  const allLines = source.split('\n')

  // Pre-pass: extract @canvas and @grid from anywhere in the source.
  // These are single-line directives with no body, so they are position-independent.
  const { canvasBackground, gridOverride, warnings: inlineWarnings, strippedLines } = extractInlineDirectives(allLines)

  let compareSplitIdx = -1
  for (let i = 0; i < strippedLines.length; i++) {
    if (strippedLines[i].trim() === '@compare split') {
      compareSplitIdx = i
      break
    }
  }

  const warnings: MetaBlockWarning[] = [...inlineWarnings]

  if (compareSplitIdx === -1) {
    const { preambleLines, segments, unknownBlockWarnings } = parseSection(strippedLines)
    warnings.push(...unknownBlockWarnings)

    const cleanMmd = preambleLines.join('\n').trimEnd()

    let animateEntries: AnimateEntry[] = []
    let presentEntries: PresentEntry[] = []
    let styleEntries: StyleEntry[] = []
    let styleEntriesLight: StyleEntry[] = []
    let styleEntriesDark: StyleEntry[] = []
    let statusDotEntries: StatusDotEntry[] = []
    let statusDotLegendConfig: StatusDotLegendConfig | null = null
    let simulateConfig: SimulateConfig | null = null
    let themeConfig: ThemeConfig | null = null
    let panelSections: PanelSection[] = []
    let badgeEntries: BadgeEntry[] = []
    let statusEntries: StatusEntry[] = []

    for (const seg of segments) {
      const kw = seg.keyword.toLowerCase()
      if (kw === 'animate') {
        const { entries, statusDotEntries: parsedDotEntries, statusDotLegendConfig: parsedDotLegendConfig, warnings: animWarn } = parseAnimateBlock(seg.bodyLines)
        animateEntries = entries
        statusDotEntries = parsedDotEntries
        statusDotLegendConfig = parsedDotLegendConfig
        warnings.push(...animWarn)
      } else if (kw === 'present') {
        presentEntries = parsePresentBlock(seg.bodyLines)
      } else if (kw === 'style') {
        const parsedStyle = parseStyleBlock(seg.bodyLines)
        styleEntries = parsedStyle.base
        styleEntriesLight = parsedStyle.light
        styleEntriesDark = parsedStyle.dark
      } else if (kw === 'simulate') {
        const { config, warnings: simWarn } = parseSimulateBlock(seg.bodyLines)
        simulateConfig = config
        warnings.push(...simWarn)
      } else if (kw === 'theme') {
        themeConfig = parseTheme(seg.bodyLines)
      } else if (kw === 'panel') {
        panelSections = parsePanelBlock(seg.bodyLines)
      } else if (kw === 'badge') {
        const { entries, warnings: badgeWarn } = parseBadgeBlock(seg.bodyLines)
        badgeEntries = entries
        warnings.push(...badgeWarn)
      } else if (kw === 'status') {
        const { entries, warnings: statusWarn } = parseStatusBlock(seg.bodyLines)
        statusEntries = entries
        warnings.push(...statusWarn)
      }
    }

    return {
      cleanMmd,
      animateEntries,
      presentEntries,
      styleEntries,
      styleEntriesLight,
      styleEntriesDark,
      statusDotEntries,
      statusDotLegendConfig,
      compareConfig: null,
      simulateConfig,
      themeConfig,
      panelSections,
      badgeEntries,
      statusEntries,
      canvasBackground,
      gridOverride,
      warnings,
    }
  }

  const beforeLines = strippedLines.slice(0, compareSplitIdx)
  const afterLines = strippedLines.slice(compareSplitIdx + 1)

  const beforeSection = parseSection(beforeLines)
  warnings.push(...beforeSection.unknownBlockWarnings)

  const beforeCleanMmd = beforeSection.preambleLines.join('\n').trimEnd()

  let animateEntries: AnimateEntry[] = []
  let presentEntries: PresentEntry[] = []
  let styleEntries: StyleEntry[] = []
  let styleEntriesLight: StyleEntry[] = []
  let styleEntriesDark: StyleEntry[] = []
  let statusDotEntries: StatusDotEntry[] = []
  let statusDotLegendConfig: StatusDotLegendConfig | null = null
  let themeConfig: ThemeConfig | null = null
  let panelSections: PanelSection[] = []
  let badgeEntries: BadgeEntry[] = []
  let statusEntries: StatusEntry[] = []

  for (const seg of beforeSection.segments) {
    const kw = seg.keyword.toLowerCase()
    if (kw === 'animate') {
      const { entries, statusDotEntries: parsedDotEntries, statusDotLegendConfig: parsedDotLegendConfig, warnings: animWarn } = parseAnimateBlock(seg.bodyLines)
      animateEntries = entries
      statusDotEntries = parsedDotEntries
      statusDotLegendConfig = parsedDotLegendConfig
      warnings.push(...animWarn)
    } else if (kw === 'present') {
      presentEntries = parsePresentBlock(seg.bodyLines)
    } else if (kw === 'style') {
      const parsedStyle = parseStyleBlock(seg.bodyLines)
      styleEntries = parsedStyle.base
      styleEntriesLight = parsedStyle.light
      styleEntriesDark = parsedStyle.dark
    } else if (kw === 'theme') {
      themeConfig = parseTheme(seg.bodyLines)
    } else if (kw === 'panel') {
      panelSections = parsePanelBlock(seg.bodyLines)
    } else if (kw === 'badge') {
      const { entries, warnings: badgeWarn } = parseBadgeBlock(seg.bodyLines)
      badgeEntries = entries
      warnings.push(...badgeWarn)
    } else if (kw === 'status') {
      const { entries, warnings: statusWarn } = parseStatusBlock(seg.bodyLines)
      statusEntries = entries
      warnings.push(...statusWarn)
    }
  }

  const afterSection = parseSection(afterLines)
  warnings.push(...afterSection.unknownBlockWarnings)

  const afterCleanMmd = afterSection.preambleLines.join('\n').trimEnd()

  let titleBefore: string | undefined
  let titleAfter: string | undefined
  let diff: boolean | undefined
  let afterAnimateEntries: AnimateEntry[] = []
  let afterPresentEntries: PresentEntry[] = []
  let afterStyleEntries: StyleEntry[] = []

  for (const seg of afterSection.segments) {
    const kw = seg.keyword.toLowerCase()
    if (kw === 'animate') {
      const { entries, warnings: animWarn } = parseAnimateBlock(seg.bodyLines)
      afterAnimateEntries = entries
      warnings.push(...animWarn)
    } else if (kw === 'present') {
      afterPresentEntries = parsePresentBlock(seg.bodyLines)
    } else if (kw === 'style') {
      afterStyleEntries = parseStyleBlock(seg.bodyLines).base
    } else if (kw === 'compare') {
      const parsed = parseCompareBlock(seg.bodyLines)
      titleBefore = parsed.titleBefore
      titleAfter = parsed.titleAfter
      diff = parsed.diff
    } else if (kw === 'theme') {
      // @theme in the after-section is parsed but not yet applied to the after
      // render — threading per-side themeConfig through CompareConfig is deferred.
      // Recognized here so it does not generate an unknown-block warning.
    }
  }

  const compareConfig: CompareConfig = {
    beforeSource: beforeCleanMmd,
    afterSource: afterCleanMmd,
    afterAnimateEntries,
    afterPresentEntries,
    afterStyleEntries,
    ...(titleBefore !== undefined ? { titleBefore } : {}),
    ...(titleAfter !== undefined ? { titleAfter } : {}),
    ...(diff !== undefined ? { diff } : {}),
  }

  return {
    cleanMmd: beforeCleanMmd,
    animateEntries,
    presentEntries,
    styleEntries,
    styleEntriesLight,
    styleEntriesDark,
    statusDotEntries,
    statusDotLegendConfig,
    compareConfig,
    simulateConfig: null,
    themeConfig,
    panelSections,
    badgeEntries,
    statusEntries,
    canvasBackground,
    gridOverride,
    warnings,
  }
}
