import type { NextConfig } from 'next'

// Dynamic configuration based on environment and nginx setup
const nextConfig: NextConfig = {
  // Use basePath only if explicitly set (for testing different strategies)
  basePath: process.env.NEXT_CONFIG_BASEPATH || (process.env.NODE_ENV === 'production' ? '' : ''),
  
  // Enable trailing slash to match nginx behavior
  trailingSlash: true,
  
  // No rewrites needed - let nginx and middleware handle routing
  async rewrites() {
    return [];
  },
  // Ensure API routes have proper CORS headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-API-Key',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
}

export default nextConfig