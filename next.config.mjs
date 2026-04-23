import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: false,
  // In dev, chunks are served from the Next.js server directly to avoid
  // chunk hash invalidation when navigating through the Vite proxy.
  assetPrefix: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined,
}

export default withMDX(config)
