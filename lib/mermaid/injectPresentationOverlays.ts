import type { PresentEntry } from './parseMetaBlocks'
import type { InjectorResult } from './injectFlowAnimations'

/**
 * Inject SVG elements for @present entries with position=attached.
 * position=fixed entries are handled by PresentationLayer (HTML overlay) and are ignored here.
 *
 * Since @present now only supports `overlay` kind (position=fixed by default),
 * this injector is effectively a pass-through. It is kept for future attached-position support.
 *
 * Returns { svg, unmatched } — same pattern as injectFlowAnimations / injectLineFlowAnimations.
 */
export function injectPresentationOverlays(
  svg: string,
  entries: PresentEntry[],
): InjectorResult {
  const attachedEntries = entries.filter(e => e.position === 'attached')
  if (attachedEntries.length === 0) return { svg, unmatched: [] }

  // No implementation for attached entries currently — return unmatched list.
  const unmatched = attachedEntries.map(e => e.target)
  return { svg, unmatched }
}
