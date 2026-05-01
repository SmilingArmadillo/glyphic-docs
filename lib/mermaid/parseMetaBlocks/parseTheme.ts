import type { ThemeConfig, ThemeTokenMap } from './types'

/**
 * Parses the body lines of an @theme block into a ThemeConfig.
 *
 * Format:
 *   light:
 *     token-name: #hexvalue
 *   dark:
 *     token-name: #hexvalue
 *
 * Section headers (light: / dark:) are case-insensitive.
 * Token lines must be indented (at least one leading space or tab).
 * Unknown section headers are ignored.
 */
export function parseTheme(lines: string[]): ThemeConfig {
  const config: ThemeConfig = {}
  let currentSection: 'light' | 'dark' | null = null

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) continue

    const isIndented = line.length > 0 && (line[0] === ' ' || line[0] === '\t')

    if (!isIndented) {
      // Section header line: "light:" or "dark:"
      const trimmed = line.trim().toLowerCase()
      if (trimmed === 'light:') {
        currentSection = 'light'
        if (!config.light) config.light = {}
      } else if (trimmed === 'dark:') {
        currentSection = 'dark'
        if (!config.dark) config.dark = {}
      } else {
        currentSection = null
      }
      continue
    }

    // Indented token line: "  token-name: value"
    if (currentSection === null) continue

    const trimmed = line.trim()
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) continue

    const tokenName = trimmed.slice(0, colonIdx).trim()
    const value = trimmed.slice(colonIdx + 1).trim()

    if (!tokenName || !value) continue

    const map = config[currentSection] as ThemeTokenMap
    map[tokenName] = value
  }

  return config
}
