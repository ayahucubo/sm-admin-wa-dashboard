import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true,
  // Remove basePath and assetPrefix to fix routing issues
  // Let nginx handle the subpath routing instead
}

export default nextConfig