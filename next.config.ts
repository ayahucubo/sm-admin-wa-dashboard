import type { NextConfig } from 'next'

// Configuration that works for both local dev and production
const nextConfig: NextConfig = {
  // Only use basePath in production for frontend routes
  basePath: process.env.NODE_ENV === 'production' ? '/sm-admin' : '',
  trailingSlash: true,
  // Ensure API routes work both with and without basePath in all environments
  async rewrites() {
    const rewrites = [];
    
    // Always allow API access without basePath for direct API calls
    rewrites.push({
      source: '/api/:path*',
      destination: '/api/:path*',
    });

    // In production, also allow API access through basePath
    if (process.env.NODE_ENV === 'production') {
      rewrites.push({
        source: '/sm-admin/api/:path*',
        destination: '/api/:path*',
      });
    }

    return {
      beforeFiles: rewrites,
    };
  },
  // Ensure API routes are not affected by basePath
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
        ],
      },
    ];
  },
}

export default nextConfig