import { defineDocs, defineCollections, defineConfig } from 'fumadocs-mdx/config'
import { z } from 'zod'

const { docs, meta } = defineDocs({
  docs: {
    dir: 'content/docs',
  },
  meta: {
    dir: 'content/docs',
  },
})

export { docs, meta }

export const blog = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    tag: z.enum(['update', 'tutorial']),
  }),
})

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
