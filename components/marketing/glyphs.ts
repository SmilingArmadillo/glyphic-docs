export interface Glyph {
  body: string
  off?: number
}

export const GLYPHS: Glyph[] = [
  {
    body:
      '<path class="gc" d="M-14,20 L-14,0 Q-14,-14 0,-14 Q14,-14 14,0 L14,20"/>' +
      '<path class="gc" d="M0,-14 L-10,-30 M0,-14 L0,-32 M0,-14 L10,-30"/>',
    off: 6,
  },
  {
    body:
      '<path class="gc" d="M-14,20 L-14,0 Q-14,-14 0,-14 Q14,-14 14,0 L14,20"/>' +
      '<path class="gc" d="M-7,-14 L-7,-26 M0,-14 L0,-26 M7,-14 L7,-26"/>',
    off: 6,
  },
  {
    body:
      '<path class="gc" d="M-14,20 L-14,0 Q-14,-14 0,-14 Q14,-14 14,0 L14,20"/>' +
      '<circle class="gc" cx="0" cy="6" r="7"/>' +
      '<path class="gc" d="M-7,6 L7,6 M0,-1 L0,13 M-5,1 L5,11 M-5,11 L5,1"/>',
    off: 6,
  },
  {
    body:
      '<path class="gc" d="M-14,20 L-14,0 Q-14,-14 0,-14 Q14,-14 14,0 L14,20"/>' +
      '<path class="gc" d="M0,-14 L-5,-22 L0,-28 L5,-22 Z"/>' +
      '<path class="gc" d="M0,-28 L-6,-34 M0,-28 L0,-36 M0,-28 L6,-34"/>',
    off: 8,
  },
  {
    body:
      '<path class="gc" d="M-14,20 L-14,0 Q-14,-14 0,-14 Q14,-14 14,0 L14,20"/>' +
      '<path class="gc" d="M-6,-14 Q-6,-26 0,-30 Q6,-26 6,-14"/>' +
      '<path class="gc" d="M0,-30 L0,-34"/>',
    off: 6,
  },
  {
    body:
      '<path class="gc" d="M-14,20 L-14,0 Q-14,-14 0,-14 Q14,-14 14,0 L14,20"/>' +
      '<path class="gc" d="M-10,-22 Q-10,-14 0,-14 Q10,-14 10,-22 M0,-14 L0,-30"/>',
    off: 6,
  },
  { body: '<path class="gc" d="M-12,-12 L0,14 L12,-12"/>' },
  { body: '<ellipse class="gc" cx="0" cy="0" rx="12" ry="16"/>' },
  {
    body:
      '<ellipse class="gc" cx="0" cy="0" rx="12" ry="16"/>' +
      '<circle class="gf" cx="0" cy="0" r="2.5"/>',
  },
  {
    body:
      '<ellipse class="gc" cx="0" cy="0" rx="12" ry="16"/>' +
      '<path class="gc" d="M0,-10 L0,10 M-8,0 L8,0 M-6,-6 L6,6 M-6,6 L6,-6"/>',
  },
  {
    body:
      '<ellipse class="gc" cx="0" cy="0" rx="12" ry="16"/>' +
      '<path class="gc" d="M0,-12 L0,12 M-10,0 L10,0"/>',
  },
  {
    body:
      '<ellipse class="gc" cx="0" cy="0" rx="12" ry="16"/>' +
      '<path class="gc" d="M-8,4 Q0,-8 8,4 M-8,4 L-8,10 M8,4 L8,10 M0,-3 L0,10"/>',
  },
  {
    body:
      '<ellipse class="gc" cx="-8" cy="-8" rx="8" ry="10"/>' +
      '<path class="gc" d="M0,2 L0,22"/>',
    off: -2,
  },
  {
    body:
      '<ellipse class="gc" cx="-6" cy="0" rx="9" ry="16"/>' +
      '<ellipse class="gc" cx="6" cy="0" rx="9" ry="16"/>',
  },
  {
    body:
      '<ellipse class="gc" cx="-6" cy="0" rx="9" ry="16"/>' +
      '<ellipse class="gc" cx="6" cy="0" rx="9" ry="16"/>' +
      '<path class="gc" d="M-4,-6 L4,6 M-4,6 L4,-6"/>',
  },
  {
    body:
      '<ellipse class="gc" cx="-10" cy="0" rx="7" ry="12"/>' +
      '<ellipse class="gc" cx="10" cy="0" rx="7" ry="12"/>' +
      '<path class="gc" d="M-3,0 L3,0"/>',
  },
]

export function buildGlyphSvg(g: Glyph, size = 44): string {
  const off = g.off ?? 0
  const inner = off
    ? `<g transform="translate(0,${off})">${g.body}</g>`
    : g.body
  return (
    `<svg viewBox="-22 -22 44 44" width="${size}" height="${size}" style="overflow:visible">` +
    `<style>` +
    `.gc{fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}` +
    `.gf{fill:currentColor}` +
    `</style>` +
    `${inner}` +
    `</svg>`
  )
}
