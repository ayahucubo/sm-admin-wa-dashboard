import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true,
  ...(process.env.NODE_ENV === 'production' && {
    assetPrefix: '/sm-admin',
    basePath: '/sm-admin'
  })
}

export default nextConfig