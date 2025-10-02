import type { NextConfig } from 'next'

// Configuration to fix API endpoint redirects
const nextConfig: NextConfig = {
  // Disable automatic trailing slash handling
  trailingSlash: false,
  
  // Configure basePath for production deployment
  basePath: '/sm-admin',
  
  // Disable redirects to prevent API issues
  skipTrailingSlashRedirect: true
}

export default nextConfig