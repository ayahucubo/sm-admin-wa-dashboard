import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true,
  ...(process.env.NODE_ENV === 'production' && {
    assetPrefix: '/genai-admin',
    basePath: '/genai-admin'
  })
}

export default nextConfig