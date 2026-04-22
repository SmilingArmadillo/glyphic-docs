import type { HomeLayoutProps } from 'fumadocs-ui/home-layout'

export const baseOptions: HomeLayoutProps = {
  nav: {
    title: 'Glyphic',
    url: 'https://glyphic.cc',
  },
  links: [
    { text: 'Docs', url: '/docs', active: 'nested-url' },
    { text: 'Examples', url: 'https://glyphic.cc/examples' },
    { text: 'Pricing', url: 'https://glyphic.cc/pricing' },
  ],
}
