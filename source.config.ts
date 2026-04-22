import { defineDocs, defineConfig } from 'fumadocs-mdx/config'
import { rehypeCode } from 'fumadocs-core/mdx-plugins'

const { docs, meta } = defineDocs({
  docs: {
    dir: 'content/docs',
  },
  meta: {
    dir: 'content/docs',
  },
})

export { docs, meta }

export default defineConfig({
  mdxOptions: {
    rehypePlugins: [
      [rehypeCode, {
        themes: {
          light: 'github-light',
          dark: 'github-dark-dimmed',
        },
      }],
    ],
  },
})
