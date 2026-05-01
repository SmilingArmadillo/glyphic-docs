'use client'

import styles from './CompareMock.module.css'

export default function CompareMock() {
  return (
    <div className={styles.wrap}>
      {/* Dark code panel */}
      <div className={styles.code}>
        <div className={styles.codeLabel}>Mermaid</div>
        <div className={styles.codeBody}>
          <span style={{ color: '#6c5ce7' }}>graph</span>{' '}
          <span style={{ color: '#a89f93' }}>TD</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  Client</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#e2d9f3' }}> API</span>{'\n'}
          <span style={{ color: '#f87171' }}>{'- API --> Monolith'}</span>{'\n'}
          <span style={{ color: '#f87171' }}>{'- Monolith --> DB'}</span>{'\n'}
          <span style={{ color: '#4ade80' }}>{'+ API --> Auth'}</span>{'\n'}
          <span style={{ color: '#4ade80' }}>{'+ API --> Orders'}</span>{'\n'}
          <span style={{ color: '#4ade80' }}>{'+ Auth --> DB'}</span>{'\n'}
          <span style={{ color: '#4ade80' }}>{'+ Orders --> DB'}</span>
        </div>
      </div>

      {/* Light preview panel */}
      <div className={styles.preview}>
        <div className={styles.previewTop}>
          <div className={styles.previewLabel}>Preview</div>
        </div>

        <div className={styles.splitArea}>
          {/* Before */}
          <div className={styles.splitSide}>
            <div className={styles.splitSideLabel}>Before</div>
            <svg width="100%" viewBox="0 0 220 370" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <defs>
                <marker id="cp-b-n" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#d4d0c9" />
                </marker>
                <marker id="cp-b-r" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#f87171" />
                </marker>
              </defs>
              <path fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#cp-b-n)" d="M70,36 L70,58" />
              <path fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#cp-b-r)" d="M70,86 L70,110" />
              <path fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#cp-b-r)" d="M70,144 L70,168" />

              {/* Client */}
              <rect x="22" y="10" width="96" height="30" rx="7" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
              <text x="70" y="25" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fill="#1a1714">Client</text>

              {/* API */}
              <rect x="30" y="58" width="80" height="30" rx="7" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
              <text x="70" y="73" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fill="#1a1714">API</text>

              {/* Monolith removed */}
              <rect x="8" y="110" width="124" height="36" rx="7" fill="#fff5f5" stroke="#f87171" strokeWidth="1.5" className={styles.nodeRem} />
              <text x="70" y="128" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="600" fill="#c0392b">Monolith</text>
              <rect x="24" y="100" width="64" height="13" rx="3" fill="#f87171" />
              <text x="56" y="106.5" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="8" fontWeight="700" fill="#fff">removed</text>

              {/* DB */}
              <rect x="30" y="168" width="80" height="30" rx="7" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
              <text x="70" y="183" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fill="#1a1714">DB</text>
            </svg>
          </div>

          {/* Divider */}
          <div className={styles.divider}>
            <div className={styles.dividerHandle}>⇔</div>
          </div>

          {/* After */}
          <div className={styles.splitSide}>
            <div className={styles.splitSideLabel}>After</div>
            <svg width="100%" viewBox="0 0 220 370" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <defs>
                <marker id="cp-a-n" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#d4d0c9" />
                </marker>
                <marker id="cp-a-g" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#4ade80" />
                </marker>
              </defs>
              <path fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#cp-a-n)" d="M70,40 L70,58" />
              <path fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#cp-a-g)" d="M58,88 L34,110" />
              <path fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#cp-a-g)" d="M82,88 L106,110" />
              {/* Auth → DB */}
              <path fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#cp-a-n)" d="M36,144 L36,158 L96,158 L96,168" />
              {/* Orders → DB */}
              <path fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#cp-a-n)" d="M106,144 L106,168" />

              {/* Client */}
              <rect x="22" y="10" width="96" height="30" rx="7" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
              <text x="70" y="25" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fill="#1a1714">Client</text>

              {/* API */}
              <rect x="30" y="58" width="80" height="30" rx="7" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
              <text x="70" y="73" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fill="#1a1714">API</text>

              {/* Auth added */}
              <rect x="6" y="110" width="60" height="30" rx="7" fill="#f0fdf4" stroke="#4ade80" strokeWidth="1.5" className={styles.nodeAdd} />
              <text x="36" y="125" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="600" fill="#166534">Auth</text>
              <rect x="8" y="100" width="48" height="13" rx="3" fill="#4ade80" />
              <text x="32" y="106.5" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="8" fontWeight="700" fill="#fff">added</text>

              {/* Orders added */}
              <rect x="74" y="110" width="60" height="30" rx="7" fill="#f0fdf4" stroke="#4ade80" strokeWidth="1.5" className={styles.nodeAddDelay} />
              <text x="104" y="125" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="600" fill="#166534">Orders</text>
              <rect x="76" y="100" width="48" height="13" rx="3" fill="#4ade80" />
              <text x="100" y="106.5" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="8" fontWeight="700" fill="#fff">added</text>

              {/* DB */}
              <rect x="66" y="168" width="60" height="30" rx="7" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
              <text x="96" y="183" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fill="#1a1714">DB</text>
            </svg>
          </div>
        </div>

        <div className={styles.legend}>
          <span><span className={styles.legendSwatch} style={{ background: '#4ade80' }} />added</span>
          <span><span className={styles.legendSwatch} style={{ background: '#f87171' }} />removed</span>
          <span><span className={styles.legendSwatch} style={{ background: '#e5e3de' }} />unchanged</span>
        </div>
      </div>
    </div>
  )
}
