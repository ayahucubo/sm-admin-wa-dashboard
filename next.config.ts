import type { NextConfig } from 'next'

// Minimal configuration to fix API redirects
const nextConfig: NextConfig = {
  basePath: '/sm-admin',
  trailingSlash: false
}

export default nextConfig