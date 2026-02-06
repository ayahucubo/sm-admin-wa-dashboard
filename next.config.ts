import type { NextConfig } from 'next'

// Configuration that works for both local dev and production
const nextConfig: NextConfig = {
  // Only use basePath in production for frontend routes
  basePath: process.env.NODE_ENV === 'production' ? '/sm-admin' : '',
  trailingSlash: true,
  // In production, ensure API routes work both with and without basePath
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      return {
        beforeFiles: [
          // Allow access to API without basePath (for direct API access)
          {
            source: '/api/:path*',
            destination: '/api/:path*',
          },
        ],
      };
    }
    return [];
  },
}

export default nextConfig