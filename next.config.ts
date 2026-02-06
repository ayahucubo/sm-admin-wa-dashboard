import type { NextConfig } from 'next'

// Configuration compatible with existing nginx rewrite rules
const nextConfig: NextConfig = {
  // Enable trailing slash to match nginx proxy_pass behavior
  trailingSlash: true,
  
  // Simple rewrites for API routes - handle both with and without trailing slash
  async rewrites() {
    return {
      beforeFiles: [
        // Handle trailing slash API requests from nginx
        {
          source: '/api/:path*/',
          destination: '/api/:path*',
        },
        // Direct API access
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        }
      ],
    };
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