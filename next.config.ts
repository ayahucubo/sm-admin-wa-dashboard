import type { NextConfig } from 'next'

// Configuration that works for both local dev and production
const nextConfig: NextConfig = {
  // Only use basePath in production for frontend routes
  basePath: process.env.NODE_ENV === 'production' ? '/sm-admin' : '',
  trailingSlash: false, // Disable automatic trailing slash for cleaner API routing
  // Ensure API routes work both with and without basePath in all environments
  async rewrites() {
    const rewrites = [];
    
    // In production, allow API access through basePath but rewrite internally
    if (process.env.NODE_ENV === 'production') {
      rewrites.push({
        source: '/sm-admin/api/:path*',
        destination: '/api/:path*',
      });
    }

    // Always allow direct API access (for both dev and production)
    rewrites.push({
      source: '/api/:path*',
      destination: '/api/:path*',
    });

    return {
      beforeFiles: rewrites,
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