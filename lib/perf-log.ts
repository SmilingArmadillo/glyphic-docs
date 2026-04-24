import fs from 'fs'
import path from 'path'

const LOG_FILE = path.join(process.cwd(), 'logs', 'nav-perf.log')

export function perfLog(label: string, durationMs?: number) {
  const line = `${new Date().toISOString()} [${label}]${durationMs !== undefined ? ` ${durationMs}ms` : ''}\n`
  process.stdout.write(line)
  try {
    fs.appendFileSync(LOG_FILE, line)
  } catch {
    // ignore write errors
  }
}

export function perfStart(label: string): () => void {
  const start = Date.now()
  perfLog(`${label} START`)
  return () => perfLog(`${label} END`, Date.now() - start)
}
