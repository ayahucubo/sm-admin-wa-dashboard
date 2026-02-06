import type { NextConfig } from 'next'

// Configuration that works for both local dev and production
const nextConfig: NextConfig = {
  // Only use basePath in production
  basePath: process.env.NODE_ENV === 'production' ? '/sm-admin' : '',
  // Enable trailing slash to avoid 308 redirects in production
  trailingSlash: true,
  // Skip trailing slash for API routes to avoid double slashes
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
      ];
    }
    return [];
  },
}

export default nextConfig