export function parseKv(kvStr: string): Record<string, string> {
  const result: Record<string, string> = {}
  const parts: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < kvStr.length; i++) {
    const ch = kvStr[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      current += ch
    } else if (ch === ',' && !inQuotes) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current)

  for (const part of parts) {
    const eqIdx = part.indexOf('=')
    if (eqIdx === -1) continue
    const key = part.slice(0, eqIdx).trim()
    let value = part.slice(eqIdx + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    if (key) result[key] = value
  }
  return result
}
