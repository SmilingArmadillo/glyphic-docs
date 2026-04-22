import { defineDocs, defineConfig } from 'fumadocs-mdx/config'

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
    rehypeCodeOptions: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
    },
  },
})
