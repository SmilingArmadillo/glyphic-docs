const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://glyphic.cc'

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Editor', href: `${APP_URL}/app` },
      { label: 'Examples', href: `${APP_URL}/examples` },
      { label: 'Pricing', href: `${APP_URL}/pricing` },
      { label: 'Changelog', href: `${APP_URL}/changelog` },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Getting Started', href: '/docs/getting-started' },
      { label: 'Guides', href: '/docs/guides' },
      { label: 'API Reference', href: '/docs/api-reference' },
    ],
  },
  {
    title: 'Meta-Language',
    links: [
      { label: '@animate', href: '/docs/guides/animations-and-transitions' },
      { label: '@compare', href: '/docs/guides/animations-and-transitions' },
      { label: '@status', href: '/docs/guides/core-concepts' },
      { label: '@present', href: '/docs/guides/animations-and-transitions' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Blog', href: `${APP_URL}/blog` },
      { label: 'Use cases', href: `${APP_URL}/use-cases` },
      { label: 'Privacy', href: `${APP_URL}/privacy` },
      { label: 'Terms', href: `${APP_URL}/terms` },
    ],
  },
]

export default function DocsFooter() {
  return (
    <footer className="border-t border-[#E5E3DA] dark:border-[#2A2A2A] bg-[#FAF9F4] dark:bg-[#0F0F0F] px-6 py-12">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6B6B6B] dark:text-[#9CA3AF] mb-3">
              {col.title}
            </p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[#1A1A1A] dark:text-[#F5F5F0] hover:text-[#6366F1] dark:hover:text-[#818CF8] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-5xl mx-auto mt-10 pt-6 border-t border-[#E5E3DA] dark:border-[#2A2A2A]">
        <p className="text-xs text-[#6B6B6B] dark:text-[#9CA3AF]">
          © {new Date().getFullYear()} Glyphic. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
