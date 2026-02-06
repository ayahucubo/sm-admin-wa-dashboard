import type { NextConfig } from 'next'

// Configuration to match nginx proxy_pass behavior (which adds trailing slash)
const nextConfig: NextConfig = {
  // Enable trailing slash to match nginx proxy_pass behavior
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