'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './LandingPage.module.css'
import RippleField from './RippleField'
import BeforeAfterSection from './BeforeAfterSection'
import StickyShotTour from './StickyShotTour'
import type { StickyShotTourStep } from './StickyShotTour'
import AnimateMock from './AnimateMock'
import StatusMock from './StatusMock'
import CompareMock from './CompareMock'
import PresentMock from './PresentMock'
import SimulateMock from './SimulateMock'
import SignOutConfirmation from './SignOutConfirmation'

const TOUR_STEPS: StickyShotTourStep[] = [
  {
    id: '@animate',
    tag: '@animate',
    heading: 'Make edges flow.',
    subhead: 'Arrows that pulse, dash, or flow like data in motion. No CSS, no JavaScript — one block at the top of your diagram.',
    caps: [
      'flow, pulse, and dash effects',
      'per-edge or global duration',
      'works with any Mermaid diagram type',
    ],
    tagline: 'Still valid Mermaid — remove the block and the diagram still renders.',
    mock: <AnimateMock />,
  },
  {
    id: '@status',
    tag: '@status',
    heading: 'Wire nodes to live data.',
    subhead: 'Nodes that reflect real state — green, amber, red — pulled from your observability stack.',
    caps: [
      'badge per node',
      'configurable polling interval',
      'custom status colors',
    ],
    tagline: "The diagram updates. Your source doesn't change.",
    mock: <StatusMock />,
  },
  {
    id: '@compare',
    tag: '@compare',
    heading: 'Two versions, one view.',
    subhead: 'A draggable divider between before and after — with optional diff highlights on changed nodes.',
    caps: [
      'side-by-side split with draggable divider',
      'diff highlights on changed nodes',
      'shareable link captures both versions',
    ],
    tagline: 'One URL. Both states. No Figma.',
    mock: <CompareMock />,
  },
  {
    id: '@present',
    tag: '@present',
    heading: 'Click through like slides.',
    subhead: 'Callout overlays that step through your diagram one annotation at a time.',
    caps: [
      'step-through mode',
      'caption bar with annotation text',
      'keyboard and click navigation',
    ],
    tagline: 'Your diagram is the deck.',
    mock: <PresentMock />,
  },
  {
    id: '@simulate',
    tag: '@simulate',
    heading: 'Watch traffic move.',
    subhead: 'Animate load distribution across your architecture — packets flowing, queues filling, services saturating.',
    caps: [
      'configurable traffic sources',
      'per-node throughput display',
      'saturated nodes highlighted',
    ],
    tagline: 'See where the bottleneck is before it pages you.',
    mock: <SimulateMock />,
  },
]

const USE_CASES = [
  {
    slug: 'sre-runbooks',
    name: 'SRE runbooks',
    desc: 'Your architecture, wired to your observability stack. When a service pages, the failing node is already red — before anyone opens Grafana.',
    quote: 'We replaced our incident Slack thread with a Glyphic link. Everyone joins the call already looking at the same diagram.',
    attribution: '— SRE lead, fintech team',
    tags: ['@status', '@animate'],
    hero: true,
  },
  {
    slug: 'architecture-reviews',
    name: 'Architecture reviews',
    desc: 'Present a before-and-after diff with animated callouts. Reviewers click through like slides — no separate Keynote to maintain.',
    quote: null,
    attribution: null,
    tags: ['@compare', '@present'],
    hero: false,
  },
  {
    slug: 'api-documentation',
    name: 'API documentation',
    desc: 'Embed a sequence diagram readers can step through one call at a time — clickable, not static.',
    quote: null,
    attribution: null,
    tags: ['@present', '@animate'],
    hero: false,
  },
]

const PRICING_TIERS = [
  {
    name: 'Free',
    eyebrow: 'FREE',
    title: 'Start instantly.',
    sub: 'The full editor. No account, no card, no install.',
    price: '$0',
    per: '/ forever',
    cta: 'Get started free',
    featured: false,
    features: [
      { label: 'Core editor (all five meta-blocks)', available: true },
      { label: 'SVG / PNG export', available: true },
      { label: '5 share links', available: true },
      { label: 'GIF / WebM export', available: false },
      { label: 'Unlimited share links', available: false },
      { label: 'Dashboard', available: false },
      { label: 'Team accounts', available: false },
    ],
  },
  {
    name: 'Pro',
    eyebrow: 'PRO',
    title: 'For daily use.',
    sub: 'Unlimited sharing. Every export format.',
    price: '$9',
    per: '/ month',
    cta: 'Get started',
    featured: true,
    features: [
      { label: 'Core editor (all five meta-blocks)', available: true },
      { label: 'SVG / PNG export', available: true },
      { label: 'GIF / WebM export', available: true },
      { label: 'Unlimited share links', available: true },
      { label: 'Dashboard', available: true },
      { label: 'Team accounts', available: false },
      { label: 'Priority support', available: false },
    ],
  },
  {
    name: 'Team',
    eyebrow: 'TEAM',
    title: 'For the whole team.',
    sub: 'Shared accounts. Priority support.',
    price: '$29',
    per: '/ month',
    cta: 'Get started',
    featured: false,
    features: [
      { label: 'Core editor (all five meta-blocks)', available: true },
      { label: 'SVG / PNG export', available: true },
      { label: 'GIF / WebM export', available: true },
      { label: 'Unlimited share links', available: true },
      { label: 'Dashboard', available: true },
      { label: 'Team accounts', available: true },
      { label: 'Priority support', available: true },
    ],
  },
]

const FAQ = [
  { q: 'Is Glyphic free?', a: 'Yes — the core editor is free, including SVG/PNG export and up to 5 share links. Pro ($9/mo) adds GIF/WebM export and unlimited sharing. Team ($29/mo) adds team accounts and priority support.' },
  { q: 'Will my existing Mermaid diagrams work?', a: 'Yes. Any valid Mermaid source renders. Meta-blocks are optional — add them when you need more than a static diagram.' },
  { q: 'What can I export to?', a: 'SVG, PNG, animated GIF, and WebM video.' },
  { q: 'Do I need to install anything?', a: 'No. Glyphic runs entirely in the browser. No extensions, no CLI.' },
  { q: 'How does sharing work?', a: 'Generate an Editable link (recipients can edit) or a View Only link (diagram only, source hidden).' },
]

export default function LandingPage() {
  const heroContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className={styles.page}>
      <SignOutConfirmation />

      {/* Hero */}
      <section id="hero" className={styles.hero}>
        <RippleField exclude={heroContentRef} accentColor="#5850EC" />
        <div className={styles['hero-content-wrap']} ref={heroContentRef}>
          <div className={styles['hero-pill']}>
            <span className={styles['hero-pill-dot']} />
            <span>Mermaid editor · Free to start · No account needed</span>
          </div>
          <h1 className={styles['hero-title']}>Turn flat diagrams into <em>living</em> ones.</h1>
          <p className={styles['hero-sub']}>Write Mermaid. Drop in <code>@animate</code>, <code>@status</code>, or <code>@compare</code>. Get a diagram that moves, updates, or compares — live in the browser.</p>
          <p className={styles['hero-tagline']}>Still just Mermaid underneath.</p>
          <div className={styles['hero-ctas']}>
            <Link href="/app" className={styles.cta}>Open editor →</Link>
            <a href="#demo" className={styles['cta-secondary']}>See it running first →</a>
          </div>
        </div>
      </section>

      {/* Product demo */}
      <section id="demo" className={styles.section}>
        <p className="eyebrow">Product demo</p>
        <h2 className={styles['section-title']}>Watch Glyphic in action.</h2>
        <p className={styles['section-sub']}>See how a flat Mermaid diagram becomes a walkthrough you can share in a review — in five lines, no Figma.</p>
        <div className={styles['demo-split']}>
          <div className={styles['demo-code']}>
            <span className={styles['demo-filename']}>production-services.mmd</span>
            <pre><span style={{ color: '#a6e3a1' }}>flowchart LR</span>{`
  GW([API Gateway])
  Auth([Auth])
  Payment([Payment])
  Orders([Orders])
  DB[(Database)]

  classDef warnNode fill:`}<span style={{ color: '#fef9c3' }}>#fef9c3</span>{`, stroke:`}<span style={{ color: '#ca8a04' }}>#ca8a04</span>{`
  classDef downNode fill:`}<span style={{ color: '#fee2e2' }}>#fee2e2</span>{`, stroke:`}<span style={{ color: '#dc2626' }}>#dc2626</span>{`

`}<span style={{ color: '#89b4fa' }}>@status</span>{`
GW: state=`}<span style={{ color: '#16a34a' }}>healthy</span>{`, label="p99: 18ms"
Auth: state=`}<span style={{ color: '#ca8a04' }}>degraded</span>{`, label="p99: 940ms"
Payment: state=`}<span style={{ color: '#dc2626' }}>down</span>{`, label="circuit open"
Orders: state=`}<span style={{ color: '#16a34a' }}>healthy</span>{`, label="p99: 42ms"

`}<span style={{ color: '#89b4fa' }}>@animate</span>{`
GW-->Auth: type=`}<span style={{ color: '#f9e2af' }}>line-flow</span>{`, color=`}<span style={{ color: '#ca8a04' }}>#ca8a04</span>{`, speed=1, preset=flash, glow=strong
GW-->Payment: type=`}<span style={{ color: '#f9e2af' }}>pill</span>{`, color=`}<span style={{ color: '#dc2626' }}>#dc2626</span>{`, speed=1, glow=strong, width=16, height=8
GW-->Orders: type=`}<span style={{ color: '#f9e2af' }}>line-flow</span>{`, color=`}<span style={{ color: '#16a34a' }}>#16a34a</span>{`, preset=long-hold`}</pre>
          </div>
          <div className={styles['demo-iframe-panel']} data-theme="light">
            <div className={styles['demo-diagram']} />
          </div>
        </div>
      </section>

      {/* Feature tour */}
      <section id="meta-language" className={styles.section}>
        <p className="eyebrow">Feature tour</p>
        <h2 className={styles['section-title']}>Five blocks. <em>Pure Mermaid underneath.</em></h2>
        <p className={styles['section-sub']}>Write a normal Mermaid diagram. Add one of these blocks at the top. The base diagram still renders — the block layers behavior on top.</p>
        <StickyShotTour steps={TOUR_STEPS} stickyTopOffset={96} />
      </section>

      {/* Editor essentials */}
      <section id="features" className={styles.section}>
        <p className="eyebrow">Editor essentials</p>
        <h2 className={styles['section-title']}>The basics, covered.</h2>
        <p className={styles['section-sub']}>Everything you&apos;d expect in a modern diagram editor — so you can focus on the meta-blocks.</p>
        <ul className={styles['features-list']}>
          <li>Zoom, pan, and fit-to-screen</li>
          <li>Light and dark themes</li>
          <li>Export as SVG, PNG, GIF, or WebM</li>
          <li>Editable and View Only share links</li>
          <li>Auto-format messy Mermaid source (Prettify)</li>
          <li>Pixel-precise grid overlay</li>
        </ul>
      </section>

      {/* Before and after */}
      <section id="compare" className={styles.section}>
        <p className="eyebrow">Before and after</p>
        <h2 className={styles['section-title']}>From a static Mermaid diagram to a <em>living</em> one.</h2>
        <p className={styles['section-sub']}>Same source. Same nodes, same edges. Now it animates, flags live state, and walks a reviewer through the change.</p>
        <BeforeAfterSection />
      </section>

      {/* Use cases */}
      <section id="use-cases" className={styles.section}>
        <p className="eyebrow">Use cases</p>
        <h2 className={styles['section-title']}>Where the meta-blocks earn their keep.</h2>
        <div className={styles['use-cases-bento']}>
          {USE_CASES.map(({ slug, name, desc, quote, attribution, tags, hero }) => (
            <Link
              key={slug}
              href={`/use-cases/${slug}`}
              className={hero ? styles['use-case-hero'] : styles['use-case-card']}
            >
              <h3 className={hero ? styles['use-case-hero-name'] : styles['use-case-name']}>{name}</h3>
              <p className={styles['use-case-desc']}>{desc}</p>
              {quote && (
                <blockquote className={styles['use-case-quote']}>
                  <p className={styles['use-case-quote-text']}>{quote}</p>
                  <footer className={styles['use-case-attribution']}>{attribution}</footer>
                </blockquote>
              )}
              <div className={styles['use-case-tags']}>
                <span className={styles['use-case-tags-label']}>Built with</span>
                {tags.map(tag => (
                  <span key={tag} className={styles['use-case-tag']}>{tag}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works — dark rhythm-break section */}
      <section id="how-it-works" className={styles['section-dark-wrap']}>
        <div className={styles['section-dark-inner']}>
          <p className="eyebrow">How it works</p>
          <h2 className={styles['section-title-dark']}>From source to share link in <em>under a minute.</em></h2>
          <div className={styles['how-grid']}>
            <div className={styles['how-card']}>
              <span className={styles['how-num']}>01</span>
              <h3 className={styles['how-card-title']}>Write Mermaid</h3>
              <p className={styles['how-card-desc']}>Start with any valid Mermaid source — flowchart, sequence, state, or entity. Paste it in. It renders instantly.</p>
            </div>
            <div className={styles['how-card']}>
              <span className={styles['how-num']}>02</span>
              <h3 className={styles['how-card-title']}>Add meta-blocks</h3>
              <p className={styles['how-card-desc']}>Drop <code>@animate</code>, <code>@status</code>, or <code>@compare</code> at the top. The base diagram still renders — the blocks layer behavior on top.</p>
            </div>
            <div className={styles['how-card']}>
              <span className={styles['how-num']}>03</span>
              <h3 className={styles['how-card-title']}>Share or export</h3>
              <p className={styles['how-card-desc']}>Generate a share link or export to SVG, PNG, GIF, or WebM. Recipients see a live, interactive diagram — no install, no account.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Examples */}
      <section id="examples" className={styles.section}>
        <p className="eyebrow">Examples</p>
        <h2 className={styles['section-title']}>Things people have built.</h2>
        <p className={styles['section-sub']}>Click any diagram to open it in the editor.</p>
        <div className={styles['examples-placeholder']}>
          <p className={styles['placeholder-text']}>Example gallery coming soon</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={styles.section}>
        <p className="eyebrow">Glyphic pricing</p>
        <h2 className={styles['section-title']}>Simple plans. <em>Serious capabilities.</em></h2>
        <p className={styles['section-sub']}>Start free. Upgrade when the team needs it.</p>
        <div className={styles['pricing-grid']}>
          {PRICING_TIERS.map(({ name, eyebrow, title, sub, price, per, cta, featured, features }) => (
            <div
              key={name}
              className={`${styles['pricing-card']}${featured ? ` ${styles['pricing-card--featured']}` : ''}`}
            >
              {featured && (
                <div className={styles['most-popular-badge']}>Most popular</div>
              )}
              <p className={styles['plan-name']}>{eyebrow}</p>
              <p className={styles['plan-title']}>{title}</p>
              <p className={styles['plan-sub']}>{sub}</p>
              <div className={styles['plan-price-row']}>
                <span className={styles['plan-price']}>{price}</span>
                <span className={styles['plan-per']}>{per}</span>
              </div>
              <Link href="/app" className={`${styles['plan-cta']}${featured ? ` ${styles['plan-cta--accent']}` : ''}`}>
                {cta}
              </Link>
              <hr className={styles['plan-divider']} />
              <ul className={styles['plan-features']}>
                {features.map(({ label, available }) => (
                  <li
                    key={label}
                    className={available ? undefined : styles['plan-feature-na']}
                  >
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className={styles['pricing-link']}><Link href="/pricing">See full pricing details →</Link></p>
      </section>

      {/* Final CTA */}
      <section className={styles['final-cta']}>
        <p className="eyebrow">Get started</p>
        <h2 className={styles['cta-title']}>Stop sharing flat diagrams.</h2>
        <p className={styles['cta-sub']}>Open the editor, paste your Mermaid, and share a living diagram in under a minute.</p>
        <Link href="/app" className={styles.cta}>Open the editor — no account needed</Link>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.section}>
        <p className="eyebrow">Common questions</p>
        <h2 className={styles['section-title']}>Questions, answered.</h2>
        <div className={styles['faq-list']}>
          {FAQ.map(({ q, a }) => (
            <details key={q} className={styles['faq-item']}>
              <summary className={styles['faq-q']}>{q}</summary>
              <p className={styles['faq-a']}>{a}</p>
            </details>
          ))}
        </div>
      </section>

    </div>
  )
}
