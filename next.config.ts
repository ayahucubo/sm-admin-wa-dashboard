import type { NextConfig } from 'next'

// Configuration that works for both local dev and production
const nextConfig: NextConfig = {
  // Only use basePath in production
  basePath: process.env.NODE_ENV === 'production' ? '/sm-admin' : '',
  trailingSlash: false
}

export default nextConfig