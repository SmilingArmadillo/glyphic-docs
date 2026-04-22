import type { HomeLayoutProps } from 'fumadocs-ui/home-layout'

export const baseOptions: HomeLayoutProps = {
  nav: {
    title: 'Glyphic',
    url: 'https://glyphic.cc',
  },
  links: [
    { text: 'Product', url: 'https://glyphic.cc/#features' },
    { text: 'Docs', url: '/docs', active: 'nested-url' },
    { text: 'Examples', url: 'https://glyphic.cc/examples' },
    { text: 'Use cases', url: 'https://glyphic.cc/use-cases' },
    { text: 'Blog', url: 'https://glyphic.cc/blog' },
    { text: 'Pricing', url: 'https://glyphic.cc/pricing' },
  ],
}
