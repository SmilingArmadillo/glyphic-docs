export function parseCompareBlock(
  lines: string[],
): { titleBefore?: string; titleAfter?: string; diff?: boolean } {
  let titleBefore: string | undefined
  let titleAfter: string | undefined
  let diff: boolean | undefined
  for (const raw of lines) {
    const line = raw.trim()
    const beforeMatch = line.match(/^title\s+before\s*:\s*"?(.+?)"?\s*$/i)
    if (beforeMatch) { titleBefore = beforeMatch[1].trim(); continue }
    const afterMatch = line.match(/^title\s+after\s*:\s*"?(.+?)"?\s*$/i)
    if (afterMatch) { titleAfter = afterMatch[1].trim(); continue }
    const diffMatch = line.match(/^diff\s*:\s*(true|false)\s*$/i)
    if (diffMatch) { diff = diffMatch[1].toLowerCase() === 'true'; continue }
  }
  return { titleBefore, titleAfter, diff }
}
