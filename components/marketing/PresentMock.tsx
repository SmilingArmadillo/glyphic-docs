'use client'

import styles from './PresentMock.module.css'

export default function PresentMock() {
  return (
    <div className={styles.wrap}>
      {/* Dark code panel */}
      <div className={styles.code}>
        <div className={styles.codeLabel}>Mermaid</div>
        <div className={styles.codeBody}>
          <span style={{ color: '#6c5ce7' }}>sequenceDiagram</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  participant</span>{' '}
          <span style={{ color: '#fbbf24' }}>User</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  participant</span>{' '}
          <span style={{ color: '#6c5ce7' }}>App</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  participant</span>{' '}
          <span style={{ color: '#a89f93' }}>Auth</span>{'\n'}
          <span style={{ color: '#fbbf24' }}>  User</span>
          <span style={{ color: '#6b6560' }}>{' ->>'}</span>
          <span style={{ color: '#6c5ce7' }}> App</span>
          <span style={{ color: '#a89f93' }}>: login()</span>{'\n'}
          <span style={{ color: '#6c5ce7' }}>  App</span>
          <span style={{ color: '#6b6560' }}>{' ->>'}</span>
          <span style={{ color: '#a89f93' }}> Auth</span>
          <span style={{ color: '#a89f93' }}>: verify()</span>{'\n'}
          <span style={{ color: '#a89f93' }}>  Auth</span>
          <span style={{ color: '#6b6560' }}>{' -->>'}</span>
          <span style={{ color: '#6c5ce7' }}> App</span>
          <span style={{ color: '#a89f93' }}>: ok</span>{'\n'}
          <span style={{ color: '#6c5ce7' }}>  App</span>
          <span style={{ color: '#6b6560' }}>{' -->>'}</span>
          <span style={{ color: '#fbbf24' }}> User</span>
          <span style={{ color: '#a89f93' }}>: dashboard</span>
        </div>
      </div>

      {/* Light preview panel */}
      <div className={styles.preview}>
        <div className={styles.previewTop}>
          <div className={styles.previewLabel}>Preview</div>
        </div>

        <div className={styles.diagramArea}>
          <svg width="100%" viewBox="0 0 460 350" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
              <marker id="pr-active" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#6c5ce7" />
              </marker>
              <marker id="pr-dim" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#d4d0c9" />
              </marker>
            </defs>

            {/* Participant boxes */}
            <rect x="8" y="10" width="56" height="28" rx="7" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
            <text x="36" y="24" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="600" fill="#1a1714">User</text>
            <line x1="36" y1="38" x2="36" y2="215" stroke="#e5e3de" strokeWidth="1.2" strokeDasharray="4 3" />

            <rect x="118" y="10" width="54" height="28" rx="7" fill="#f0eeff" stroke="#6c5ce7" strokeWidth="1.5" />
            <text x="145" y="24" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="600" fill="#4a3fa5">App</text>
            <line x1="145" y1="38" x2="145" y2="215" stroke="#c4b5fd" strokeWidth="1.2" strokeDasharray="4 3" />

            <rect x="228" y="10" width="54" height="28" rx="7" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
            <text x="255" y="24" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fill="#6b6560">Auth</text>
            <line x1="255" y1="38" x2="255" y2="215" stroke="#e5e3de" strokeWidth="1.2" strokeDasharray="4 3" />

            {/* Step 1 ACTIVE: User → App */}
            <rect x="28" y="58" width="125" height="20" rx="3" fill="#6c5ce710" />
            <line x1="36" y1="68" x2="136" y2="68" stroke="#6c5ce7" strokeWidth="2.5" markerEnd="url(#pr-active)" />
            <text x="90" y="62" textAnchor="middle" fontFamily="-apple-system,sans-serif" fontSize="11" fontWeight="600" fill="#6c5ce7">login()</text>

            {/* Step 2 dim: App → Auth */}
            <line x1="145" y1="110" x2="245" y2="110" stroke="#d4d0c9" strokeWidth="1.2" strokeOpacity="0.4" markerEnd="url(#pr-dim)" />
            <text x="196" y="104" textAnchor="middle" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#c4c0ba">verify()</text>

            {/* Step 3 dim: Auth → App return */}
            <line x1="245" y1="142" x2="153" y2="142" stroke="#d4d0c9" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="4 3" markerEnd="url(#pr-dim)" />
            <text x="196" y="136" textAnchor="middle" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#c4c0ba">ok</text>

            {/* Step 4 dim: App → User return */}
            <line x1="145" y1="178" x2="44" y2="178" stroke="#d4d0c9" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="4 3" markerEnd="url(#pr-dim)" />
            <text x="94" y="172" textAnchor="middle" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#c4c0ba">dashboard</text>
          </svg>
        </div>

        {/* Caption bar */}
        <div className={styles.captionBar}>
          <div className={styles.captionText}>
            <div className={styles.captionStep}>STEP 1 OF 4</div>
            <div className={styles.captionLabel}>User submits login form</div>
          </div>
          <div className={styles.navDots}>
            <div className={`${styles.navDot} ${styles.navDotActive}`} />
            <div className={styles.navDot} />
            <div className={styles.navDot} />
            <div className={styles.navDot} />
          </div>
          <div className={styles.navBtns}>
            <button className={styles.navBtn} disabled aria-label="Previous step">←</button>
            <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} aria-label="Next step">→</button>
          </div>
        </div>
      </div>
    </div>
  )
}
