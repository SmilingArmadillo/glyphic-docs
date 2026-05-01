import { parseSvgDoc } from './parseSvgDoc'

const EMOJI_REGEX = /^(\p{Emoji_Presentation}|\p{Emoji}️)/u
const XHTML_NS = 'http://www.w3.org/1999/xhtml'

function looksLikeEmoji(text: string): boolean {
  return EMOJI_REGEX.test(text.trimStart())
}

function processLabelDiv(div: Element, doc: Document): boolean {
  const html = div.innerHTML
  const brIdx = html.indexOf('<br')
  if (brIdx === -1) return false

  const beforeBr = html.slice(0, brIdx).trim()
  if (!looksLikeEmoji(beforeBr)) return false

  // Match <br>, <br/>, <br />, or <br xmlns="..."/> forms
  const afterBrMatch = html.slice(brIdx).match(/^<br(?:\s[^>]*)?\s*\/?>/)
  if (!afterBrMatch) return false

  const afterBrRaw = html.slice(brIdx + afterBrMatch[0].length).trim()
  if (!afterBrRaw) return false

  // Extract plain text values to avoid re-injecting HTML
  const tempDiv = doc.createElementNS(XHTML_NS, 'div')
  tempDiv.innerHTML = beforeBr
  const emojiText = tempDiv.textContent ?? beforeBr

  const tempDiv2 = doc.createElementNS(XHTML_NS, 'div')
  tempDiv2.innerHTML = afterBrRaw
  const labelText = tempDiv2.textContent ?? afterBrRaw

  // Rebuild using DOM APIs — no raw HTML injection
  while (div.firstChild) div.removeChild(div.firstChild)

  const iconSpan = doc.createElementNS(XHTML_NS, 'span')
  iconSpan.setAttribute('style', 'font-size:1.6em;display:block;text-align:center;line-height:1.2')
  iconSpan.textContent = emojiText

  const labelSpan = doc.createElementNS(XHTML_NS, 'span')
  labelSpan.setAttribute('style', 'display:block;text-align:center')
  labelSpan.textContent = labelText

  div.appendChild(iconSpan)
  div.appendChild(labelSpan)

  return true
}

function processForFo(fo: Element, doc: Document): boolean {
  const labelDivs = Array.from(fo.querySelectorAll('div.label-content, div[class*="label"]'))
  for (const div of labelDivs) {
    if (processLabelDiv(div, doc)) return true
  }
  const allDivs = Array.from(fo.querySelectorAll('div'))
  for (const div of allDivs) {
    if (processLabelDiv(div, doc)) return true
  }
  return false
}

export function injectIconLabels(svg: string): string {
  let doc: Document
  try {
    const parsed = parseSvgDoc(svg)
    if (!parsed) return svg
    doc = parsed
  } catch {
    return svg
  }

  let modified = false

  const foreignObjects = Array.from(doc.querySelectorAll('foreignObject'))
  for (const fo of foreignObjects) {
    if (processForFo(fo, doc)) modified = true
  }

  if (!modified) return svg
  return new XMLSerializer().serializeToString(doc)
}
