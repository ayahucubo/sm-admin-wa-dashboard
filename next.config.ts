import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true,
  // Configure for production subpath deployment
  ...(process.env.NODE_ENV === 'production' && {
    assetPrefix: '/sm-admin',
    basePath: '/sm-admin'
  }),
  // Remove problematic rewrites and redirects that cause 308 loops
  async rewrites() {
    return []
  },
  async redirects() {
    return []
  }
}

export default nextConfig