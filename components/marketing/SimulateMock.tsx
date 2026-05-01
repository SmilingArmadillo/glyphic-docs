'use client'

import styles from './SimulateMock.module.css'

function Packet({ d, color, dur, begin }: {
  d: string
  color: string
  dur: string
  begin: string
}) {
  return (
    <circle r="4" fill={color} fillOpacity="0">
      <animate attributeName="fill-opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur={dur} begin={begin} repeatCount="indefinite" />
      <animateMotion dur={dur} begin={begin} repeatCount="indefinite">
        <mpath href={`#${d}`} />
      </animateMotion>
    </circle>
  )
}

export default function SimulateMock() {
  return (
    <div className={styles.wrap}>
      {/* Dark code panel */}
      <div className={styles.code}>
        <div className={styles.codeLabel}>Mermaid</div>
        <div className={styles.codeBody}>
          <span style={{ color: '#6c5ce7' }}>graph</span>{' '}
          <span style={{ color: '#a89f93' }}>LR</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  LB</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#e2d9f3' }}> SvcA</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  LB</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#e2d9f3' }}> SvcB</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  LB</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#e2d9f3' }}> SvcC</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  SvcA</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#f87171' }}> DB</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  SvcB</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#f87171' }}> DB</span>{'\n'}
          <span style={{ color: '#e2d9f3' }}>  SvcC</span>
          <span style={{ color: '#6b6560' }}>{' -->'}</span>
          <span style={{ color: '#4ade80' }}> Cache</span>{'\n'}
          <span style={{ color: '#6b6560' }}>{'\n'}  %% @simulate</span>{'\n'}
          <span style={{ color: '#6b6560' }}>  %% rps: 120</span>
        </div>
      </div>

      {/* Light preview panel */}
      <div className={styles.preview}>
        <div className={styles.previewTop}>
          <div className={styles.previewLabel}>Preview</div>
          <div className={styles.simBadge}><div className={styles.simDot} /> simulating · 120 rps</div>
        </div>

        <div className={styles.diagramArea}>
          <svg width="100%" viewBox="-30 -20 460 290" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
              <marker id="sm-arr-n" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#d4d0c9" />
              </marker>
              <marker id="sm-arr-r" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#e17055" />
              </marker>
              <marker id="sm-arr-g" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#00b894" />
              </marker>
              {/* Named paths for animateMotion mpath references */}
              <path id="sm-p-lbA"    d="M62,95 L128,62" />
              <path id="sm-p-lbB"    d="M62,105 L128,105" />
              <path id="sm-p-lbC"    d="M62,115 L128,148" />
              <path id="sm-p-aDb"    d="M172,62 L210,95" />
              <path id="sm-p-bDb"    d="M172,105 L210,105" />
              <path id="sm-p-cCache" d="M172,148 L210,148" />
            </defs>

            {/* Edges */}
            <use href="#sm-p-lbA"    fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#sm-arr-n)" />
            <use href="#sm-p-lbB"    fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#sm-arr-n)" />
            <use href="#sm-p-lbC"    fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#sm-arr-n)" />
            <use href="#sm-p-aDb"    fill="none" stroke="#e17055" strokeWidth="1.5" markerEnd="url(#sm-arr-r)" />
            <use href="#sm-p-bDb"    fill="none" stroke="#e17055" strokeWidth="1.5" markerEnd="url(#sm-arr-r)" />
            <use href="#sm-p-cCache" fill="none" stroke="#e5e3de" strokeWidth="1.5" markerEnd="url(#sm-arr-g)" />

            {/* Packets — purple on LB→Svc, red toward DB, green toward Cache */}
            <Packet d="sm-p-lbA"    color="#6c5ce7" dur="0.9s"  begin="0s" />
            <Packet d="sm-p-lbA"    color="#6c5ce7" dur="0.9s"  begin="0.3s" />
            <Packet d="sm-p-lbB"    color="#6c5ce7" dur="0.9s"  begin="0.1s" />
            <Packet d="sm-p-lbB"    color="#6c5ce7" dur="0.9s"  begin="0.4s" />
            <Packet d="sm-p-lbC"    color="#6c5ce7" dur="0.9s"  begin="0.2s" />
            <Packet d="sm-p-lbC"    color="#6c5ce7" dur="0.9s"  begin="0.5s" />
            <Packet d="sm-p-aDb"    color="#e17055" dur="1.4s"  begin="0s" />
            <Packet d="sm-p-aDb"    color="#e17055" dur="1.4s"  begin="0.7s" />
            <Packet d="sm-p-bDb"    color="#e17055" dur="1.4s"  begin="0.2s" />
            <Packet d="sm-p-cCache" color="#00b894" dur="0.5s"  begin="0s" />
            <Packet d="sm-p-cCache" color="#00b894" dur="0.5s"  begin="0.17s" />
            <Packet d="sm-p-cCache" color="#00b894" dur="0.5s"  begin="0.34s" />

            {/* LB */}
            <rect x="10" y="80" width="52" height="46" rx="9" fill="#f0eeff" stroke="#6c5ce7" strokeWidth="1.5" />
            <text x="36" y="97" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="11" fontWeight="700" fill="#4a3fa5">LB</text>
            <text x="36" y="113" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#7c6fd0">120rps</text>

            {/* SvcA */}
            <rect x="128" y="44" width="44" height="36" rx="8" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
            <text x="150" y="57" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="11" fill="#1a1714">SvcA</text>
            <text x="150" y="72" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#a89f93">40rps</text>

            {/* SvcB */}
            <rect x="128" y="88" width="44" height="36" rx="8" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
            <text x="150" y="101" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="11" fill="#1a1714">SvcB</text>
            <text x="150" y="116" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#a89f93">40rps</text>

            {/* SvcC */}
            <rect x="128" y="132" width="44" height="36" rx="8" fill="#fff" stroke="#d4d0c9" strokeWidth="1.5" />
            <text x="150" y="145" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="11" fill="#1a1714">SvcC</text>
            <text x="150" y="160" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#a89f93">40rps</text>

            {/* DB — saturated */}
            <rect x="210" y="78" width="52" height="46" rx="9" fill="#fff5f3" stroke="#e17055" strokeWidth="2" className={styles.nodeRed} />
            <text x="236" y="95" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="11" fontWeight="700" fill="#c0392b">DB</text>
            <text x="236" y="112" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#e17055">⚠ 97rps</text>
            <rect x="208" y="66" width="70" height="15" rx="4" fill="#e17055" className={styles.nodeRed} />
            <text x="243" y="73.5" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="8" fontWeight="700" fill="#fff">SATURATED</text>

            {/* Cache */}
            <rect x="210" y="132" width="52" height="36" rx="8" fill="#f0fdf4" stroke="#00b894" strokeWidth="1.5" />
            <text x="236" y="146" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="11" fontWeight="500" fill="#065f46">Cache</text>
            <text x="236" y="161" textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#00b894">40rps</text>
          </svg>
        </div>

        {/* Throughput bars */}
        <div className={styles.tputWrap}>
          <div className={styles.tputRow}>
            <div className={styles.tputLabel}>LB</div>
            <div className={styles.tputTrack}><div className={styles.tputFill} style={{ width: '60%', background: '#6c5ce7' }} /></div>
            <div className={styles.tputVal}>120 rps</div>
          </div>
          <div className={styles.tputRow}>
            <div className={styles.tputLabel}>DB</div>
            <div className={styles.tputTrack}><div className={styles.tputFill} style={{ width: '97%', background: '#e17055' }} /></div>
            <div className={styles.tputVal} style={{ color: '#e17055', fontWeight: 600 }}>⚠ 97/80</div>
          </div>
          <div className={styles.tputRow}>
            <div className={styles.tputLabel}>Cache</div>
            <div className={styles.tputTrack}><div className={styles.tputFill} style={{ width: '20%', background: '#00b894' }} /></div>
            <div className={styles.tputVal}>40 rps</div>
          </div>
        </div>
      </div>
    </div>
  )
}
