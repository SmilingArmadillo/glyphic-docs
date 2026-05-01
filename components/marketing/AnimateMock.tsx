import styles from './AnimateMock.module.css'

export default function AnimateMock() {
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
          <span style={{ color: '#e2d9f3' }}> Gateway</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  Gateway</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#e2d9f3' }}> Auth</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  Gateway</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#e2d9f3' }}> Orders</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  Auth</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#4ade80' }}> Cache</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  Orders</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#e2d9f3' }}> Inventory</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  Inventory</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#f87171' }}> DB</span>{'\n'}
          <span style={{ color: '#6b6560' }}>{'\n'}  %% bottleneck</span>{'\n'}
          <span style={{ color: '#6b6560' }}>  %% latency: 3.8s</span>
        </div>
      </div>

      {/* Light preview panel */}
      <div className={styles.preview}>
        <div className={styles.previewTop}>
          <div className={styles.previewLabel}>Preview</div>
        </div>

        <div className={styles.diagramArea}>
          <svg width="100%" viewBox="0 0 420 340" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
              <marker id="am-arr-n" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L7,3 z" fill="#d4d0c9" />
              </marker>
              <marker id="am-arr-p" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L7,3 z" fill="#6c5ce7" />
              </marker>
              <marker id="am-arr-g" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L7,3 z" fill="#00b894" />
              </marker>
              <marker id="am-arr-r" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L7,3 z" fill="#e17055" />
              </marker>
            </defs>

            {/* Ghost base edges */}
            <path fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#am-arr-n)" d="M52,110 L100,110" />
            <path fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#am-arr-n)" d="M168,95 L208,68" />
            <path fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#am-arr-n)" d="M168,125 L208,152" />
            <path fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#am-arr-n)" d="M240,58 L296,58" />
            <path fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#am-arr-n)" d="M236,162 L236,190" />
            <path fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#am-arr-n)" d="M236,224 L236,256" />

            {/* Animated edges */}
            <path className={styles.animFlow} stroke="#6c5ce7" markerEnd="url(#am-arr-p)" d="M52,110 L100,110" />
            <path className={styles.animFlow} stroke="#6c5ce7" markerEnd="url(#am-arr-p)" style={{ animationDelay: '0.2s' }} d="M168,95 L208,68" />
            <path className={styles.animFlow} stroke="#6c5ce7" markerEnd="url(#am-arr-p)" style={{ animationDelay: '0.4s' }} d="M168,125 L208,152" />
            {/* Cache: fast green */}
            <path className={styles.animFlowFast} stroke="#00b894" markerEnd="url(#am-arr-g)" d="M240,58 L296,58" />
            {/* DB path: slow red flow */}
            <path className={styles.animFlowSlow} stroke="#e17055" markerEnd="url(#am-arr-r)" d="M236,162 L236,190" />
            <path className={styles.animFlowSlow} stroke="#e17055" markerEnd="url(#am-arr-r)" style={{ animationDelay: '1.9s' }} d="M236,224 L236,256" />

            {/* Client */}
            <rect x="8" y="92" width="44" height="36" rx="8" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
            <text x="30" y="110" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="11" fill="#1a1714">Client</text>

            {/* Gateway */}
            <rect x="100" y="88" width="68" height="44" rx="8" fill="#f0eeff" stroke="#6c5ce7" strokeWidth="1.5" />
            <text x="134" y="110" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="600" fill="#4a3fa5">Gateway</text>

            {/* Auth */}
            <rect x="208" y="46" width="50" height="34" rx="8" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
            <text x="233" y="63" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="11" fill="#1a1714">Auth</text>

            {/* Cache: green fast */}
            <rect x="296" y="42" width="46" height="34" rx="7" fill="#eafaf5" stroke="#00b894" strokeWidth="1.5" />
            <text x="319" y="59" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="9" fontWeight="600" fill="#007a5e">Cache</text>
            <rect x="300" y="32" width="38" height="13" rx="3" fill="#00b894" />
            <text x="319" y="38.5" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="8" fontWeight="700" fill="#fff">0.3s</text>

            {/* Orders */}
            <rect x="208" y="136" width="56" height="34" rx="8" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
            <text x="236" y="153" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="11" fill="#1a1714">Orders</text>

            {/* Inventory */}
            <rect x="204" y="190" width="64" height="34" rx="8" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
            <text x="236" y="207" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="11" fill="#1a1714">Inventory</text>

            {/* DB: red bottleneck */}
            <rect x="208" y="256" width="56" height="30" rx="6" fill="#fff5f3" stroke="#e17055" strokeWidth="2" className={styles.nodeGlowRed} />
            <text x="236" y="271" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="11" fontWeight="700" fill="#c0392b">DB</text>
            <rect x="219" y="244" width="34" height="13" rx="3" fill="#e17055" />
            <text x="236" y="250.5" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="8" fontWeight="700" fill="#fff">3.8s</text>

            {/* Bottleneck label */}
            <text x="130" y="325" textAnchor="middle" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#a89f93" fontStyle="italic">⚠ bottleneck</text>
          </svg>
        </div>

        <div className={styles.legend}>
          <span><span className={styles.legendDot} style={{ background: '#00b894' }} />fast</span>
          <span><span className={styles.legendDot} style={{ background: '#6c5ce7' }} />normal</span>
          <span><span className={styles.legendDot} style={{ background: '#e17055' }} />bottleneck</span>
        </div>
      </div>
    </div>
  )
}
