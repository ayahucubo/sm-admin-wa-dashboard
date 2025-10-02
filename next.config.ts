import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true,
  // Configure for production subpath deployment
  ...(process.env.NODE_ENV === 'production' && {
    assetPrefix: '/sm-admin',
    basePath: '/sm-admin'
  }),
  // Ensure API routes work correctly with basePath
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/api/:path*',
          destination: '/api/:path*'
        }
      ]
    }
    return []
  },
  // Handle redirects for proper subpath navigation
  async redirects() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/sm-admin',
          destination: '/sm-admin/',
          permanent: true,
        }
      ]
    }
    return []
  }
}

export default nextConfig