import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, relative } from 'path'

const CONTENT_DIR = join(process.cwd(), 'content/docs')
const PUBLIC_DIR = join(process.cwd(), 'public')
const BASE_URL = '/docs'

function collectMdxFiles(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      collectMdxFiles(fullPath, files)
    } else if (entry.name.endsWith('.mdx')) {
      files.push(fullPath)
    }
  }
  return files
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { title: 'Untitled', description: '' }
  const title = match[1].match(/title:\s*(.+)/)?.[1]?.trim() ?? 'Untitled'
  const description = match[1].match(/description:\s*(.+)/)?.[1]?.trim() ?? ''
  return { title, description }
}

function filePathToUrl(filePath) {
  const rel = relative(CONTENT_DIR, filePath)
    .replace(/\\/g, '/')
    .replace(/\.mdx$/, '')
    .replace(/\/index$/, '')
    .replace(/^index$/, '')
  return rel ? `${BASE_URL}/${rel}` : BASE_URL
}

const allFiles = collectMdxFiles(CONTENT_DIR).sort()

const sections = {
  'Getting Started': [],
  'Guides': [],
  'API Reference': [],
}
const uncategorized = []

for (const file of allFiles) {
  const rel = relative(CONTENT_DIR, file).replace(/\\/g, '/')
  const content = readFileSync(file, 'utf-8')
  const { title } = extractFrontmatter(content)
  const url = filePathToUrl(file)
  const entry = `- [${title}](${url})`

  if (rel.startsWith('getting-started/')) sections['Getting Started'].push(entry)
  else if (rel.startsWith('guides/')) sections['Guides'].push(entry)
  else if (rel.startsWith('api-reference/')) sections['API Reference'].push(entry)
  else uncategorized.push(entry)
}

let llmsTxt = `# Glyphic\n\n> Glyphic is a visual editor for Mermaid diagrams. Build, animate, compare, and share architecture diagrams without leaving your browser.\n\n`

for (const [section, entries] of Object.entries(sections)) {
  if (entries.length > 0) {
    llmsTxt += `## ${section}\n${entries.join('\n')}\n\n`
  }
}
if (uncategorized.length > 0) {
  llmsTxt += `## General\n${uncategorized.join('\n')}\n\n`
}

writeFileSync(join(PUBLIC_DIR, 'llms.txt'), llmsTxt.trim())
console.log('✓ llms.txt written')

let llmsFullTxt = `# Glyphic — Full Documentation\n\nGenerated: ${new Date().toISOString()}\n\n---\n\n`
for (const file of allFiles) {
  const content = readFileSync(file, 'utf-8')
  const url = filePathToUrl(file)
  llmsFullTxt += `## ${url}\n\n${content}\n\n---\n\n`
}

writeFileSync(join(PUBLIC_DIR, 'llms-full.txt'), llmsFullTxt)
console.log('✓ llms-full.txt written')
