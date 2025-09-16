import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true,
  ...(process.env.NODE_ENV === 'production' && {
    assetPrefix: '/sm-admin',
    basePath: '/sm-admin'
  }),
  // Ensure API routes work correctly with basePath
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/sm-admin/api/:path*',
          destination: '/api/:path*'
        }
      ]
    }
    return []
  }
}

export default nextConfig