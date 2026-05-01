import type { Background } from './background'

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null
  const n = parseInt(clean, 16)
  return {
    r: (n >> 16) & 0xff,
    g: (n >> 8) & 0xff,
    b: n & 0xff,
  }
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const linearize = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

export function adaptLineColor(hex: string, background: Background): string {
  if (background !== 'dark') return hex
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  if (relativeLuminance(rgb.r, rgb.g, rgb.b) >= 0.2) return hex
  const inv = (c: number) => (255 - c).toString(16).padStart(2, '0')
  return `#${inv(rgb.r)}${inv(rgb.g)}${inv(rgb.b)}`
}
