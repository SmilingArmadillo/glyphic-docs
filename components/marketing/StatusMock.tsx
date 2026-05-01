import styles from './StatusMock.module.css'

export default function StatusMock() {
  return (
    <div className={styles.wrap}>
      {/* Dark code panel */}
      <div className={styles.code}>
        <div className={styles.codeLabel}>Mermaid</div>
        <div className={styles.codeBody}>
          <span style={{ color: '#6c5ce7' }}>graph</span>{' '}
          <span style={{ color: '#a89f93' }}>TD</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  CDN</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#e2d9f3' }}> LB</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  LB</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#e2d9f3' }}> API</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  API</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#4ade80' }}> Auth</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  API</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#fbbf24' }}> Orders</span>{'\n'}
          <span style={{ color: '#fbbf24' }}>  Orders</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#f87171' }}> DB</span>{'\n'}
          <span style={{ color: '#fbbf24' }}>  Orders</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#fbbf24' }}> Queue</span>{'\n'}
          <span style={{ color: '#fbbf24' }}>  Queue</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#f87171' }}> Worker</span>
        </div>
      </div>

      {/* Light preview panel */}
      <div className={styles.preview}>
        <div className={styles.previewTop}>
          <div className={styles.previewLabel}>Preview</div>
          <div className={styles.pollBadge}><div className={styles.pollDot} /> polling 5s</div>
        </div>

        <div className={styles.diagramArea}>
          <svg width="100%" viewBox="0 0 460 395" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
              <marker id="st-arr-n" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#d4d0c9" />
              </marker>
              <marker id="st-arr-r" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#e17055" />
              </marker>
              <marker id="st-arr-a" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" />
              </marker>
            </defs>

            {/* CDN → LB */}
            <path fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#st-arr-n)" d="M140,38 L140,56" />
            {/* LB → API */}
            <path fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#st-arr-n)" d="M140,84 L140,102" />
            {/* API → Auth */}
            <path fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#st-arr-n)" d="M120,130 L72,148" />
            {/* API → Orders */}
            <path fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#st-arr-n)" d="M160,130 L208,148" />
            {/* Orders → DB red flicker */}
            <path fill="none" stroke="#e17055" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#st-arr-r)" className={styles.edgeRed} d="M196,176 L182,204" />
            {/* Orders → Queue amber */}
            <path fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#st-arr-a)" className={styles.edgeAmber} d="M240,176 L256,204" />
            {/* Queue → Worker amber */}
            <path fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#st-arr-a)" className={styles.edgeAmber} style={{ animationDelay: '0.5s' }} d="M256,232 L256,256" />

            {/* CDN — green */}
            <rect x="84" y="14" width="112" height="28" rx="8" fill="#f0fdf4" stroke="#00b894" strokeWidth="1.5" />
            <text x="140" y="28" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="500">
              <tspan fill="#00b894" fontSize="14">●</tspan><tspan fill="#065f46" dx="4">CDN</tspan>
            </text>

            {/* LB — green */}
            <rect x="84" y="56" width="112" height="28" rx="8" fill="#f0fdf4" stroke="#00b894" strokeWidth="1.5" />
            <text x="140" y="70" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="500">
              <tspan fill="#00b894" fontSize="14">●</tspan><tspan fill="#065f46" dx="4">LB</tspan>
            </text>

            {/* API — green */}
            <rect x="84" y="102" width="112" height="28" rx="8" fill="#f0fdf4" stroke="#00b894" strokeWidth="1.5" />
            <text x="140" y="116" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="500">
              <tspan fill="#00b894" fontSize="14">●</tspan><tspan fill="#065f46" dx="4">API</tspan>
            </text>

            {/* Auth — green */}
            <rect x="14" y="148" width="96" height="28" rx="8" fill="#f0fdf4" stroke="#00b894" strokeWidth="1.5" />
            <text x="62" y="162" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="500">
              <tspan fill="#00b894" fontSize="14">●</tspan><tspan fill="#065f46" dx="4">Auth</tspan>
            </text>

            {/* Orders — amber breathe */}
            <rect x="170" y="148" width="96" height="28" rx="8" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.5" className={styles.nodeAmber} />
            <text x="218" y="162" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="600">
              <tspan fill="#f59e0b" fontSize="14">●</tspan><tspan fill="#92400e" dx="4">Orders</tspan>
            </text>

            {/* DB — red glow */}
            <rect x="144" y="204" width="76" height="28" rx="8" fill="#fff5f3" stroke="#e17055" strokeWidth="2" className={styles.nodeRed} />
            <text x="182" y="218" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="700">
              <tspan fill="#e17055" fontSize="14">●</tspan><tspan fill="#c0392b" dx="4">DB ⚠</tspan>
            </text>

            {/* Queue — amber breathe */}
            <rect x="232" y="204" width="62" height="28" rx="8" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.5" className={styles.nodeAmber} style={{ animationDelay: '0.5s' }} />
            <text x="263" y="218" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="600">
              <tspan fill="#f59e0b" fontSize="14">●</tspan><tspan fill="#92400e" dx="4">Queue</tspan>
            </text>

            {/* Worker — red glow */}
            <rect x="224" y="256" width="78" height="28" rx="6" fill="#fff5f3" stroke="#e17055" strokeWidth="2" className={styles.nodeRed} style={{ animationDelay: '0.3s' }} />
            <text x="263" y="270" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="700">
              <tspan fill="#e17055" fontSize="14">●</tspan><tspan fill="#c0392b" dx="4">Worker ⚠</tspan>
            </text>
          </svg>
        </div>

        <div className={styles.legend}>
          <span><span className={styles.legendDot} style={{ background: '#00b894' }} />ok</span>
          <span><span className={styles.legendDot} style={{ background: '#f59e0b' }} />degraded</span>
          <span><span className={styles.legendDot} style={{ background: '#e17055' }} />down</span>
        </div>
      </div>
    </div>
  )
}
