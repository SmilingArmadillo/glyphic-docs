import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.columns}>
        <div className={styles.column}>
          <p className={styles.heading}>Product</p>
          <ul className={styles.list}>
            <li><Link href="/app" className={styles.link}>Editor</Link></li>
            <li><Link href="/pricing" className={styles.link}>Pricing</Link></li>
            <li><Link href="/changelog" className={styles.link}>Changelog</Link></li>
          </ul>
        </div>
        <div className={styles.column}>
          <p className={styles.heading}>Learn</p>
          <ul className={styles.list}>
            <li><Link href="/docs" className={styles.link}>Docs</Link></li>
            <li><Link href="/examples" className={styles.link}>Examples</Link></li>
            <li><Link href="/use-cases" className={styles.link}>Use cases</Link></li>
            <li><Link href="/blog" className={styles.link}>Blog</Link></li>
          </ul>
        </div>
        <div className={styles.column}>
          <p className={styles.heading}>Meta-language</p>
          <ul className={styles.list}>
            <li><Link href="/docs/guides/animations-and-transitions" className={styles.link}>@animate</Link></li>
            <li><Link href="/docs/guides/core-concepts" className={styles.link}>@status</Link></li>
            <li><Link href="/docs/guides/animations-and-transitions" className={styles.link}>@compare</Link></li>
            <li><Link href="/docs/guides/animations-and-transitions" className={styles.link}>@present</Link></li>
            <li><Link href="/docs/guides/animations-and-transitions" className={styles.link}>@simulate</Link></li>
          </ul>
        </div>
        <div className={styles.column}>
          <p className={styles.heading}>Company</p>
          <ul className={styles.list}>
            <li><Link href="/privacy" className={styles.link}>Privacy</Link></li>
            <li><Link href="/terms" className={styles.link}>Terms</Link></li>
            <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.link}>GitHub ↗</a></li>
            <li><a href="https://x.com" target="_blank" rel="noopener noreferrer" className={styles.link}>X ↗</a></li>
          </ul>
        </div>
      </div>
      <p className={styles.copyright}>© {new Date().getFullYear()} Glyphic</p>
    </footer>
  )
}
