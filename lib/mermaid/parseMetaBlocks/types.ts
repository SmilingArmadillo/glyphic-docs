export type AnimateTargetKind = 'edge' | 'node'

export interface AnimateEntry {
  kind: AnimateTargetKind
  from?: string
  to?: string
  nodeId?: string
  type: 'line-flow' | 'dot' | 'node-pulse' | 'oval-inset' | 'pill'
  color?: string
  speed?: number
  preset?: 'flash' | 'balanced' | 'long-hold'
  glow?: 'none' | 'subtle' | 'strong'
  pulseStyle?: 'border' | 'fill' | 'shadow' | 'flash' | 'ripple' | 'fill-flash'
  rippleCount?: number
  intensity?: 'low' | 'medium' | 'high'
  pillWidth?: number
  pillHeight?: number
  edgeLabel?: string
  particleCount?: number
}

export interface PresentEntry {
  kind: 'overlay'
  target: string
  text: string
  color?: string
  type?: string
  position: 'fixed' | 'attached'
}

export interface GlowConfig {
  variant: 'outer-halo' | 'inner-rim' | 'fill-tint' | 'combined'
  intensity: 'subtle' | 'medium' | 'strong'
  color?: string
}

export interface StyleEntry {
  nodeId: string
  outline?: string
  sublabel?: string
  fill?: string
  glow?: GlowConfig
  color?: string
  fontWeight?: string
  fontSize?: string
  textGlow?: 'subtle' | 'medium' | 'strong'
}

export interface ParsedStyleBlock {
  base: StyleEntry[]
  light: StyleEntry[]
  dark: StyleEntry[]
}

export type HealthState = 'healthy' | 'degraded' | 'down'

export type BadgeDirection = 'top' | 'bottom' | 'left' | 'right'

export interface BadgeEntry {
  nodeId: string
  direction: BadgeDirection
  label: string
  bgColor: string
  textColor: string
  outline?: string
  /** Human-readable display name for the right panel (from name= param) */
  name?: string
  /** Health state, present only when badge uses state= syntax */
  state?: HealthState
  /** Description shown below the name in the right panel (from label= param on state= badges) */
  panelLabel?: string
}

export type StatusLegendPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-right'
  | 'below-left' | 'below-center' | 'below-right'
  | 'right-panel'

export interface PanelSection {
  heading: string
  body: string
}

export interface StatusEntry {
  nodeId: string
  state: HealthState
  name?: string
  label?: string
}

export interface StatusLegendConfig {
  position: StatusLegendPosition
  padding: number
}

export type StatusDotStyle = 'breathe' | 'blink' | 'sonar' | 'ripple'
export type StatusDotPosition = 'left' | 'right' | 'top-left' | 'top-right' | 'top-center' | 'left-inset' | 'center'

export interface StatusDotEntry {
  nodeId: string
  style: StatusDotStyle
  color: string
  position: StatusDotPosition
  size: number
  speed: number
  rippleCount: number
  label?: string
}

export interface StatusDotLegendConfig {
  position: StatusLegendPosition
  padding: number
}

export interface CompareConfig {
  titleBefore?: string
  titleAfter?: string
  beforeSource: string
  afterSource: string
  afterAnimateEntries: AnimateEntry[]
  afterPresentEntries: PresentEntry[]
  afterStyleEntries: StyleEntry[]
  diff?: boolean
}

export interface SimulateNodeConfig {
  nodeId: string
  stressThreshold: number
}

export interface SimulatePhase {
  type: 'steady' | 'spike' | 'burst'
  duration: number
  rps: number
  burstDuty: number
}

export interface SimulateQueueConfig {
  capacity: number | null
  drainRate: number
}

export interface SimulateConfig {
  defaultRps: number
  phases: SimulatePhase[]
  queueConfig: SimulateQueueConfig
  nodes: SimulateNodeConfig[]
}

export interface ThemeTokenMap {
  [tokenName: string]: string
}

export interface ThemeConfig {
  light?: ThemeTokenMap
  dark?: ThemeTokenMap
}

export type MetaBlockWarningKind =
  | 'unmatched-animate-edge'
  | 'unmatched-animate-node'
  | 'unmatched-style-node'
  | 'unmatched-present-badge'
  | 'unmatched-badge'
  | 'duplicate-badge'
  | 'duplicate-status'
  | 'malformed-animate-line'
  | 'malformed-simulate-line'
  | 'unknown-block'
  | 'invalid-canvas-value'
  | 'invalid-grid-value'

export interface MetaBlockWarning {
  kind: MetaBlockWarningKind
  message: string
  line?: string
}

export interface ParsedMetaBlocks {
  cleanMmd: string
  animateEntries: AnimateEntry[]
  presentEntries: PresentEntry[]
  styleEntries: StyleEntry[]
  styleEntriesLight: StyleEntry[]
  styleEntriesDark: StyleEntry[]
  statusDotEntries: StatusDotEntry[]
  statusDotLegendConfig: StatusDotLegendConfig | null
  compareConfig: CompareConfig | null
  simulateConfig: SimulateConfig | null
  themeConfig: ThemeConfig | null
  panelSections: PanelSection[]
  badgeEntries: BadgeEntry[]
  statusEntries: StatusEntry[]
  canvasBackground: 'dark' | 'light' | null
  gridOverride: boolean | null
  warnings: MetaBlockWarning[]
}
