import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true,
  assetPrefix: '/genai-admin',
  basePath: '/genai-admin' // <-- Tambahkan ini!
}

export default nextConfig