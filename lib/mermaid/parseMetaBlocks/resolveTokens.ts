import type { ThemeConfig } from './types'

/**
 * Resolves a single color value that may be a token reference ($token-name).
 *
 * If `value` starts with `$`, look up the token name in the provided themeConfig:
 *   1. Try the requested background first
 *   2. Fall back to the other background
 *   3. If still not found, return the original value unchanged
 *
 * If `value` does not start with `$`, return it unchanged (backwards compatible).
 */
export function resolveColor(
  value: string,
  themeConfig: ThemeConfig | null,
  background: 'light' | 'dark',
): string {
  if (!value.startsWith('$')) return value
  if (!themeConfig) return value

  const tokenName = value.slice(1)
  const primary = themeConfig[background]
  if (primary && tokenName in primary) return primary[tokenName]

  const fallback = background === 'dark' ? themeConfig.light : themeConfig.dark
  if (fallback && tokenName in fallback) return fallback[tokenName]

  return value
}

/**
 * The set of object fields that carry color values and should have token
 * references resolved. Only these fields are touched — all other string
 * fields (nodeId, from, to, type, edgeLabel, etc.) are left unchanged.
 */
const COLOR_FIELDS = new Set(['color', 'outline', 'bgColor', 'textColor', 'fill'])

/**
 * Resolves token references in the known color fields of an entry object.
 * Only fields listed in COLOR_FIELDS are inspected; all other fields are
 * copied unchanged.
 *
 * Returns a new object — does not mutate the input.
 */
export function resolveTokens<T extends object>(
  obj: T,
  themeConfig: ThemeConfig | null,
  background: 'light' | 'dark',
): T {
  if (!themeConfig) return obj

  const result = { ...obj } as Record<string, unknown>
  for (const key of Object.keys(result)) {
    if (!COLOR_FIELDS.has(key)) continue
    const val = result[key]
    if (typeof val === 'string') {
      result[key] = resolveColor(val, themeConfig, background)
    }
  }
  return result as T
}
