import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: false,
  webpack(webpackConfig) {
    // In dev, prevent fumadocs-ui from being split into lazy chunks.
    // Without this, clicking a docs link triggers a large chunk download that hangs navigation.
    webpackConfig.optimization.splitChunks = {
      ...webpackConfig.optimization.splitChunks,
      cacheGroups: {
        ...(webpackConfig.optimization.splitChunks?.cacheGroups ?? {}),
        fumadocs: {
          test: /[\\/]node_modules[\\/]fumadocs/,
          name: 'fumadocs',
          chunks: 'all',
          priority: 20,
          enforce: true,
        },
      },
    }
    return webpackConfig
  },
}

export default withMDX(config)
