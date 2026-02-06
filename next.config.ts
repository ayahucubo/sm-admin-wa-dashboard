import type { NextConfig } from 'next'

// Configuration compatible with existing nginx rewrite rules
const nextConfig: NextConfig = {
  // Remove basePath - let nginx handle the routing
  // basePath: process.env.NODE_ENV === 'production' ? '/sm-admin' : '',
  trailingSlash: false,
  
  // Simple rewrites for API routes
  async rewrites() {
    return {
      beforeFiles: [
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