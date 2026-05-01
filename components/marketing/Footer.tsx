import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.columns}>
        <div className={styles.column}>
          <p className={styles.heading}>Product</p>
          <ul className={styles.list}>
            <li><a href="/app" className={styles.link}>Editor</a></li>
            <li><a href="/pricing" className={styles.link}>Pricing</a></li>
            <li><a href="/changelog" className={styles.link}>Changelog</a></li>
          </ul>
        </div>
        <div className={styles.column}>
          <p className={styles.heading}>Learn</p>
          <ul className={styles.list}>
            <li><a href="/docs" className={styles.link}>Docs</a></li>
            <li><a href="/examples" className={styles.link}>Examples</a></li>
            <li><a href="/use-cases" className={styles.link}>Use cases</a></li>
            <li><a href="/blog" className={styles.link}>Blog</a></li>
          </ul>
        </div>
        <div className={styles.column}>
          <p className={styles.heading}>Meta-language</p>
          <ul className={styles.list}>
            <li><a href="/docs/guides/animations-and-transitions" className={styles.link}>@animate</a></li>
            <li><a href="/docs/guides/core-concepts" className={styles.link}>@status</a></li>
            <li><a href="/docs/guides/animations-and-transitions" className={styles.link}>@compare</a></li>
            <li><a href="/docs/guides/animations-and-transitions" className={styles.link}>@present</a></li>
            <li><a href="/docs/guides/animations-and-transitions" className={styles.link}>@simulate</a></li>
          </ul>
        </div>
        <div className={styles.column}>
          <p className={styles.heading}>Company</p>
          <ul className={styles.list}>
            <li><a href="/privacy" className={styles.link}>Privacy</a></li>
            <li><a href="/terms" className={styles.link}>Terms</a></li>
            <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.link}>GitHub ↗</a></li>
            <li><a href="https://x.com" target="_blank" rel="noopener noreferrer" className={styles.link}>X ↗</a></li>
          </ul>
        </div>
      </div>
      <p className={styles.copyright}>© {new Date().getFullYear()} Glyphic</p>
    </footer>
  )
}
