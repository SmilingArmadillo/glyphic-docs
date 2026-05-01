export type DiagramFont =
  | 'IBM Plex Sans'
  | 'Inter'
  | 'Roboto'
  | 'DM Sans'
  | 'Source Sans 3'
  | 'Space Grotesk'
  | 'JetBrains Mono'
  | 'Fira Code'
  | 'Georgia'
  | 'monospace';

export type MermaidTheme = 'dark' | 'default' | 'forest' | 'neutral' | 'base';

export interface DiagramOpacity {
  nodes: number;   // 0–1
  edges: number;   // 0–1
  labels: number;  // 0–1
}

export interface DiagramThemeVars {
  primaryColor?: string;  // hex — node fill (sets both primaryColor + mainBkg)
  lineColor?: string;     // hex — edge/line color
}

export const DEFAULT_FONT: DiagramFont = 'IBM Plex Sans';
export const DEFAULT_OPACITY: DiagramOpacity = { nodes: 1, edges: 1, labels: 1 };
export const DEFAULT_THEME_VARS: DiagramThemeVars = {};

export interface ThemePreset {
  font: DiagramFont;
  themeVars: Required<DiagramThemeVars>;
  opacity: DiagramOpacity;
}

export const THEME_PRESETS: Record<MermaidTheme, ThemePreset> = {
  dark:    { font: 'monospace', themeVars: { primaryColor: '#1f2020', lineColor: '#d3d3d3' }, opacity: { nodes: 1, edges: 1, labels: 1 } },
  default: { font: 'monospace', themeVars: { primaryColor: '#ececff', lineColor: '#333333' }, opacity: { nodes: 1, edges: 1, labels: 1 } },
  forest:  { font: 'monospace', themeVars: { primaryColor: '#cde498', lineColor: '#000000' }, opacity: { nodes: 1, edges: 1, labels: 1 } },
  neutral: { font: 'monospace', themeVars: { primaryColor: '#eeeeee', lineColor: '#666666' }, opacity: { nodes: 1, edges: 1, labels: 1 } },
  base:    { font: 'monospace', themeVars: { primaryColor: '#fff4dd', lineColor: '#0b0b0b' }, opacity: { nodes: 1, edges: 1, labels: 1 } },
};

export const THEME_DEFAULTS: Record<MermaidTheme, Required<DiagramThemeVars>> = {
  dark:    { primaryColor: '#1f2020', lineColor: '#d3d3d3' },
  default: { primaryColor: '#ececff', lineColor: '#333333' },
  forest:  { primaryColor: '#cde498', lineColor: '#000000' },
  neutral: { primaryColor: '#eeeeee', lineColor: '#666666' },
  base:    { primaryColor: '#fff4dd', lineColor: '#0b0b0b' },
};

export interface DotAnimationConfig {
  enabled: boolean;
  color: string;    // hex
  speed: number;    // seconds per cycle
  particleCount?: number;
}

export type LineFlowMotionPreset = 'flash' | 'balanced' | 'long-hold';
export type LineFlowGlowPreset = 'none' | 'subtle' | 'strong';

export interface LineFlowConfig {
  enabled: boolean;
  color: string;              // hex
  speed: number;              // seconds per cycle
  motionPreset: LineFlowMotionPreset;
  glowPreset: LineFlowGlowPreset;
  particleCount?: number;
}

export type PillGlowPreset = 'none' | 'subtle' | 'strong';

export interface PillFlowConfig {
  enabled: boolean;
  color: string;       // hex
  speed: number;       // seconds per cycle
  glowPreset: PillGlowPreset;
  width: number;       // px — pill length along travel axis
  height: number;      // px — pill thickness; rx = height / 2
  particleCount?: number;
}

export const DEFAULT_PILL_FLOW_CONFIG: PillFlowConfig = {
  enabled: false,
  color: '#4fc3f7',
  speed: 2,
  glowPreset: 'subtle',
  width: 28,
  height: 14,
};

export interface AnimationConfig {
  dot: DotAnimationConfig;
  lineFlow: LineFlowConfig;
  pill: PillFlowConfig;
}

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  dot: { enabled: false, color: '#4fc3f7', speed: 2 },
  lineFlow: { enabled: false, color: '#4fc3f7', speed: 3.5, motionPreset: 'balanced', glowPreset: 'subtle' },
  pill: { enabled: false, color: '#4fc3f7', speed: 2, glowPreset: 'subtle', width: 28, height: 14 },
};
