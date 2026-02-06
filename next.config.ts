import type { NextConfig } from 'next'

// Configuration for nginx deployment with API fixes
const nextConfig: NextConfig = {
  // Use basePath only if explicitly set (for testing different strategies)
  basePath: process.env.NEXT_CONFIG_BASEPATH || (process.env.NODE_ENV === 'production' ? '/sm-admin' : ''),
  
  // Disable trailing slash to prevent API redirects
  trailingSlash: false,
  
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
            value: 'Content-Type, Authorization, X-API-Key, x-api-key',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/app/api/:path*',
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
            value: 'Content-Type, Authorization, X-API-Key, x-api-key',
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