import { useEffect, useReducer, useRef } from 'react'
import mermaid from 'mermaid'
import type { DiagramFont, MermaidTheme, DiagramOpacity, DiagramThemeVars, AnimationConfig } from './style'
import { THEME_DEFAULTS } from './style'
import type { Background } from './background'
import { MERMAID_THEME } from './background'
import { adaptLineColor } from './colorUtils'
import { parseMetaBlocks, resolveColor } from './parseMetaBlocks'
import type { MetaBlockWarning, PanelSection, PresentEntry, CompareConfig, AnimateEntry, SimulateConfig, BadgeEntry, StatusEntry, StatusDotEntry, StatusDotLegendConfig, ThemeConfig } from './parseMetaBlocks'
import type { SimulationState } from './renderPipeline'
import { extractDiagramElements, computeDiff } from './diffDiagram'
import { injectDiffHighlights } from './injectDiffHighlights'
import { normalizeSvgViewBox } from './normalizeSvgViewBox'
import { runRenderPipeline } from './renderPipeline'

function resolvePanelTokens(sections: PanelSection[], themeConfig: ThemeConfig | null, background: 'dark' | 'light'): PanelSection[] {
  if (!themeConfig) return sections
  const TOKEN_RE = /\$[\w-]+/g
  return sections.map(s => ({
    heading: s.heading,
    body: s.body.replace(TOKEN_RE, tok => resolveColor(tok, themeConfig, background)),
  }))
}

function cleanMermaidError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  const useful = lines.find(
    (l) =>
      !l.startsWith('Parse error') &&
      !l.startsWith('Syntax error') &&
      l.length > 0
  )
  return useful ?? lines[0] ?? 'Unknown render error'
}

interface MermaidRenderResult {
  renderedSvg: string | null
  renderedSvgAfter: string | null
  compareConfig: CompareConfig | null
  simulateConfig: SimulateConfig | null
  presentEntries: PresentEntry[]
  presentEntriesAfter: PresentEntry[]
  animateEntries: AnimateEntry[]
  animateEntriesAfter: AnimateEntry[]
  badgeEntries: BadgeEntry[]
  statusEntries: StatusEntry[]
  statusDotEntries: StatusDotEntry[]
  statusDotLegendConfig: StatusDotLegendConfig | null
  panelSections: PanelSection[]
  canvasBackground: 'dark' | 'light' | null
  gridOverride: boolean | null
  metaWarnings: MetaBlockWarning[]
  error: string | null
  errorAfter: string | null
  isRendering: boolean
}

interface RenderState {
  renderedSvg: string | null
  renderedSvgAfter: string | null
  compareConfig: CompareConfig | null
  simulateConfigValue: SimulateConfig | null
  error: string | null
  errorAfter: string | null
  isRendering: boolean
  metaWarnings: MetaBlockWarning[]
  presentEntries: PresentEntry[]
  presentEntriesAfter: PresentEntry[]
  animateEntries: AnimateEntry[]
  animateEntriesAfter: AnimateEntry[]
  badgeEntries: BadgeEntry[]
  statusEntries: StatusEntry[]
  statusDotEntries: StatusDotEntry[]
  statusDotLegendConfig: StatusDotLegendConfig | null
  panelSections: PanelSection[]
  canvasBackground: 'dark' | 'light' | null
  gridOverride: boolean | null
}

interface CompareResultPayload {
  renderedSvg: string | null
  renderedSvgAfter: string | null
  compareConfig: CompareConfig
  error: string | null
  errorAfter: string | null
  metaWarnings: MetaBlockWarning[]
  presentEntries: PresentEntry[]
  presentEntriesAfter: PresentEntry[]
  animateEntries: AnimateEntry[]
  animateEntriesAfter: AnimateEntry[]
  badgeEntries: BadgeEntry[]
  statusEntries: StatusEntry[]
  statusDotEntries: StatusDotEntry[]
  statusDotLegendConfig: StatusDotLegendConfig | null
  panelSections: PanelSection[]
  canvasBackground: 'dark' | 'light' | null
  gridOverride: boolean | null
}

interface SingleResultPayload {
  renderedSvg: string | null
  simulateConfigValue: SimulateConfig | null
  metaWarnings: MetaBlockWarning[]
  presentEntries: PresentEntry[]
  animateEntries: AnimateEntry[]
  badgeEntries: BadgeEntry[]
  statusEntries: StatusEntry[]
  statusDotEntries: StatusDotEntry[]
  statusDotLegendConfig: StatusDotLegendConfig | null
  panelSections: PanelSection[]
  canvasBackground: 'dark' | 'light' | null
  gridOverride: boolean | null
}

type RenderAction =
  | { type: 'RESET' }
  | { type: 'SET_RENDERING' }
  | { type: 'SET_COMPARE_RESULT'; payload: CompareResultPayload }
  | { type: 'SET_SINGLE_RESULT'; payload: SingleResultPayload }
  | { type: 'SET_ERROR'; payload: { error: string; metaWarnings: MetaBlockWarning[] } }

const initialRenderState: RenderState = {
  renderedSvg: null,
  renderedSvgAfter: null,
  compareConfig: null,
  simulateConfigValue: null,
  error: null,
  errorAfter: null,
  isRendering: false,
  metaWarnings: [],
  presentEntries: [],
  presentEntriesAfter: [],
  animateEntries: [],
  animateEntriesAfter: [],
  badgeEntries: [],
  statusEntries: [],
  statusDotEntries: [],
  statusDotLegendConfig: null,
  panelSections: [],
  canvasBackground: null,
  gridOverride: null,
}

function renderReducer(state: RenderState, action: RenderAction): RenderState {
  switch (action.type) {
    case 'RESET':
      return initialRenderState
    case 'SET_RENDERING':
      return { ...state, isRendering: true }
    case 'SET_COMPARE_RESULT':
      return {
        ...initialRenderState,
        ...action.payload,
        isRendering: false,
      }
    case 'SET_SINGLE_RESULT':
      return {
        ...initialRenderState,
        ...action.payload,
        isRendering: false,
      }
    case 'SET_ERROR':
      return {
        ...initialRenderState,
        error: action.payload.error,
        metaWarnings: action.payload.metaWarnings,
      }
  }
}

export function useMermaidRender(
  source: string,
  animationConfig: AnimationConfig,
  font: DiagramFont,
  mermaidTheme: MermaidTheme,
  themeVars: DiagramThemeVars,
  opacity: DiagramOpacity,
  background: Background,
  simulationState: SimulationState | null,
  simulateConfig: SimulateConfig | null,
  activePhaseIndex: number,
): MermaidRenderResult {
  const [state, dispatch] = useReducer(renderReducer, initialRenderState)

  const latestRenderIdRef = useRef(0)
  const prevSourceRef = useRef(source)
  const simulationStateRef = useRef<SimulationState | null>(simulationState)
  const animationSpeedScaleRef = useRef(1)

  simulationStateRef.current = simulationState

  useEffect(() => {
    if (source.trim() === '') {
      dispatch({ type: 'RESET' })
      return
    }

    const isSourceChange = source !== prevSourceRef.current
    prevSourceRef.current = source
    const delay = isSourceChange ? 500 : 0

    const debounceTimer = setTimeout(async () => {
      try {
        await document.fonts.load(`16px "${font}"`)
      } catch {
        // system fonts don't need loading
      }
      const fontFamily = font.includes(' ') ? `"${font}", sans-serif` : font

      const renderId = ++latestRenderIdRef.current
      dispatch({ type: 'SET_RENDERING' })

      const parsed = parseMetaBlocks(source)
      const { cleanMmd, animateEntries, presentEntries: parsedPresentEntries, styleEntries: parsedStyleEntries, styleEntriesLight: parsedStyleEntriesLight, styleEntriesDark: parsedStyleEntriesDark, badgeEntries: parsedBadgeEntries, statusEntries: parsedStatusEntries, statusDotEntries: parsedStatusDotEntries, statusDotLegendConfig: parsedStatusDotLegendConfig, panelSections: parsedPanelSections, warnings: parseWarnings, compareConfig: parsedCompareConfig, simulateConfig: parsedSimulateConfig, themeConfig, canvasBackground, gridOverride } = parsed

      // @canvas directive wins over the user toggle for theme selection.
      const effectiveBackground = canvasBackground ?? background
      const effectiveTheme = (MERMAID_THEME[effectiveBackground] ?? mermaidTheme) as MermaidTheme
      const themeVariables: Record<string, string> = { fontFamily }
      if (themeVars.primaryColor) {
        themeVariables.primaryColor = themeVars.primaryColor
        themeVariables.mainBkg = themeVars.primaryColor
      }
      const resolvedLineColor = themeVars.lineColor ?? THEME_DEFAULTS[effectiveTheme].lineColor
      themeVariables.lineColor = adaptLineColor(resolvedLineColor, effectiveBackground)

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: effectiveTheme,
        themeVariables,
      })
      const allWarnings: MetaBlockWarning[] = [...parseWarnings]

      if (parsedCompareConfig !== null) {
        // Compare mode: render both before and after independently
        let beforeSvg: string | null = null
        let afterSvg: string | null = null
        let beforeError: string | null = null
        let afterError: string | null = null
        let beforePresentEntries: PresentEntry[] = []
        let afterPresentEntries: PresentEntry[] = []

        // Run before render
        try {
          const beforeResult = await runRenderPipeline(
            cleanMmd,
            animateEntries,
            parsedPresentEntries,
            parsedStyleEntries,
            parsedStatusDotEntries,
            animationConfig,
            opacity,
            renderId,
            'before',
            null,
            null,
            1,
            themeConfig,
            background,
            parsedStyleEntriesLight,
            parsedStyleEntriesDark,
            parsedBadgeEntries,
          )
          if (renderId !== latestRenderIdRef.current) return
          beforeSvg = beforeResult.svg
          beforePresentEntries = beforeResult.presentEntries
          allWarnings.push(...beforeResult.warnings)
        } catch (err) {
          if (renderId !== latestRenderIdRef.current) return
          beforeError = cleanMermaidError(err)
        }

        // Run after render (independently — before error does not block after)
        try {
          const afterResult = await runRenderPipeline(
            parsedCompareConfig.afterSource,
            parsedCompareConfig.afterAnimateEntries,
            parsedCompareConfig.afterPresentEntries,
            parsedCompareConfig.afterStyleEntries,
            [],
            animationConfig,
            opacity,
            renderId,
            'after',
            null,
            null,
            1,
            themeConfig,
            background,
            [],
            [],
            [],
          )
          if (renderId !== latestRenderIdRef.current) return
          afterSvg = afterResult.svg
          afterPresentEntries = afterResult.presentEntries
          allWarnings.push(...afterResult.warnings)
        } catch (err) {
          if (renderId !== latestRenderIdRef.current) return
          afterError = cleanMermaidError(err)
        }

        if (renderId !== latestRenderIdRef.current) return

        // Diff highlighting — inject after all other injectors
        if (parsedCompareConfig.diff && beforeSvg !== null && afterSvg !== null) {
          const beforeElements = extractDiagramElements(parsedCompareConfig.beforeSource)
          const afterElements  = extractDiagramElements(parsedCompareConfig.afterSource)
          const diff = computeDiff(beforeElements, afterElements)
          beforeSvg = injectDiffHighlights(beforeSvg, diff, 'before')
          afterSvg  = injectDiffHighlights(afterSvg,  diff, 'after')
        }

        // Normalize viewBox — make both SVGs share the same canvas dimensions
        // so the compare panels render at identical scale and position.
        // leftPadFraction shifts diagram content rightward so nothing falls
        // behind the divider's minimum position (DIVIDER_MIN = 10 → 0.10).
        if (beforeSvg !== null && afterSvg !== null) {
          const normalized = normalizeSvgViewBox(beforeSvg, afterSvg, 0.10)
          beforeSvg = normalized.before
          afterSvg  = normalized.after
        }

        dispatch({
          type: 'SET_COMPARE_RESULT',
          payload: {
            renderedSvg: beforeSvg,
            renderedSvgAfter: afterSvg,
            compareConfig: parsedCompareConfig,
            error: beforeError,
            errorAfter: afterError,
            metaWarnings: allWarnings,
            presentEntries: beforePresentEntries,
            presentEntriesAfter: afterPresentEntries,
            animateEntries: animateEntries,
            animateEntriesAfter: parsedCompareConfig.afterAnimateEntries,
            badgeEntries: parsedBadgeEntries,
            statusEntries: parsedStatusEntries,
            statusDotEntries: parsedStatusDotEntries,
            statusDotLegendConfig: parsedStatusDotLegendConfig,
            panelSections: resolvePanelTokens(parsedPanelSections, themeConfig, background),
            canvasBackground,
            gridOverride,
          },
        })
      } else {
        // Single diagram mode
        try {
          // Compute speed scale from active phase: faster animation at higher load
          if (parsedSimulateConfig && activePhaseIndex >= 0) {
            const activePhase = parsedSimulateConfig.phases[activePhaseIndex]
            if (activePhase) {
              animationSpeedScaleRef.current = Math.max(0.25, Math.min(4, activePhase.rps / parsedSimulateConfig.defaultRps))
            }
          } else {
            animationSpeedScaleRef.current = 1
          }
          const result = await runRenderPipeline(
            cleanMmd,
            animateEntries,
            parsedPresentEntries,
            parsedStyleEntries,
            parsedStatusDotEntries,
            animationConfig,
            opacity,
            renderId,
            'single',
            simulationStateRef.current,
            parsedSimulateConfig,
            animationSpeedScaleRef.current,
            themeConfig,
            background,
            parsedStyleEntriesLight,
            parsedStyleEntriesDark,
            parsedBadgeEntries,
          )
          if (renderId !== latestRenderIdRef.current) return

          dispatch({
            type: 'SET_SINGLE_RESULT',
            payload: {
              renderedSvg: result.svg,
              simulateConfigValue: parsedSimulateConfig,
              metaWarnings: [...allWarnings, ...result.warnings],
              presentEntries: result.presentEntries,
              animateEntries: animateEntries,
              badgeEntries: parsedBadgeEntries,
              statusEntries: parsedStatusEntries,
              statusDotEntries: parsedStatusDotEntries,
              statusDotLegendConfig: parsedStatusDotLegendConfig,
              panelSections: resolvePanelTokens(parsedPanelSections, themeConfig, background),
              canvasBackground,
              gridOverride,
            },
          })
        } catch (err) {
          if (renderId !== latestRenderIdRef.current) return
          dispatch({
            type: 'SET_ERROR',
            payload: {
              error: cleanMermaidError(err),
              metaWarnings: allWarnings,
            },
          })
        }
      }
    }, delay)

    return () => {
      clearTimeout(debounceTimer)
    }
  }, [source, animationConfig, font, mermaidTheme, themeVars, opacity, background, simulateConfig, activePhaseIndex])

  return {
    renderedSvg: state.renderedSvg,
    renderedSvgAfter: state.renderedSvgAfter,
    compareConfig: state.compareConfig,
    simulateConfig: state.simulateConfigValue,
    error: state.error,
    errorAfter: state.errorAfter,
    isRendering: state.isRendering,
    metaWarnings: state.metaWarnings,
    presentEntries: state.presentEntries,
    presentEntriesAfter: state.presentEntriesAfter,
    animateEntries: state.animateEntries,
    animateEntriesAfter: state.animateEntriesAfter,
    badgeEntries: state.badgeEntries,
    statusEntries: state.statusEntries,
    statusDotEntries: state.statusDotEntries,
    statusDotLegendConfig: state.statusDotLegendConfig,
    panelSections: state.panelSections,
    canvasBackground: state.canvasBackground,
    gridOverride: state.gridOverride,
  }
}
