'use client'

import { useState } from 'react'
import styles from './BeforeAfterSection.module.css'

type Pair = {
  beforeSubtitle: string
  afterSubtitle: string
  midTagline: string
  codeLines: string[]
  blockLine: string
  blockValueLine: string
  previewNodes: string[]
  previewLabel: string
}

const PAIRS: Pair[] = [
  {
    beforeSubtitle: 'Static Mermaid diagram',
    afterSubtitle: 'Animated with @animate',
    midTagline: 'living\ndiagram',
    codeLines: ['flowchart LR', '  A[API] --> B[Service]', '  B --> C[DB] --> D[Cache]'],
    blockLine: '@animate',
    blockValueLine: '  edges: flow',
    previewNodes: ['API', 'Service', 'DB', 'Cache'],
    previewLabel: '▶ edges animating',
  },
  {
    beforeSubtitle: 'Static architecture map',
    afterSubtitle: 'Live status with @status',
    midTagline: 'real-time\nstatus',
    codeLines: ['flowchart TD', '  API --> Auth', '  API --> DB'],
    blockLine: '@status',
    blockValueLine: '  DB: red',
    previewNodes: ['API', 'Auth', 'DB'],
    previewLabel: '● live status',
  },
  {
    beforeSubtitle: 'Single-version diagram',
    afterSubtitle: 'Side-by-side with @compare',
    midTagline: 'before &\nafter',
    codeLines: ['flowchart LR', '  A --> B --> C'],
    blockLine: '@compare',
    blockValueLine: '  highlight: changed',
    previewNodes: ['A', 'B', 'C'],
    previewLabel: '◧ diff view',
  },
]

export default function BeforeAfterSection() {
  const [active, setActive] = useState(0)
  const pair = PAIRS[active]

  return (
    <div className={styles.root}>
      {/* Corner labels */}
      <div className={styles.labels}>
        <div className={styles['label-before']}>
          <span className={styles['label-heading']}>Before</span>
          <span className={styles['label-sub']}>{pair.beforeSubtitle}</span>
        </div>
        <div className={styles['label-after']}>
          <span className={styles['label-heading-after']}>After</span>
          <span className={styles['label-sub']}>{pair.afterSubtitle}</span>
        </div>
      </div>

      {/* Panels */}
      <div className={styles.panels}>
        {/* Before panel */}
        <div className={styles['panel-before']}>
          <div className={styles['panel-code']}>
            {pair.codeLines.map(line => (
              <div key={line} className={styles['code-line']}>{line}</div>
            ))}
          </div>
          <div className={styles['panel-preview']}>
            <div className={styles['preview-nodes']}>
              {pair.previewNodes.map(node => (
                <span key={node} className={styles['preview-node-light']}>{node}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Middle */}
        <div className={styles.middle}>
          <span className={styles['mid-tagline']}>
            {pair.midTagline.split('\n').map((line, i) => (
              <span key={i}>{line}{i < pair.midTagline.split('\n').length - 1 && <br />}</span>
            ))}
          </span>
          <span className={styles['mid-arrow']}>→</span>
        </div>

        {/* After panel */}
        <div className={styles['panel-after']}>
          <div className={styles['panel-code']}>
            {pair.codeLines.map(line => (
              <div key={line} className={styles['code-line-dark']}>{line}</div>
            ))}
            <div className={styles['code-block-name']}>{pair.blockLine}</div>
            <div className={styles['code-block-value']}>{pair.blockValueLine}</div>
          </div>
          <div className={styles['panel-preview-dark']}>
            <div className={styles['preview-nodes']}>
              {pair.previewNodes.map(node => (
                <span key={node} className={styles['preview-node-dark']}>{node}</span>
              ))}
            </div>
            <p className={styles['preview-status']}>{pair.previewLabel}</p>
          </div>
        </div>
      </div>

      {/* Dot switcher */}
      <div className={styles.switcher}>
        <div className={styles.dots}>
          {PAIRS.map((_, i) => (
            <button
              key={i}
              className={i === active ? styles['dot-active'] : styles.dot}
              onClick={() => setActive(i)}
              aria-label={`Show pair ${i + 1}`}
            />
          ))}
        </div>
        <p className={styles['switcher-hint']}>Click any dot to switch between examples</p>
      </div>
    </div>
  )
}
