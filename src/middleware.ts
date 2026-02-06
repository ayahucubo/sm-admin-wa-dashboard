import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Handle API routes specifically - prevent trailing slash redirects
  if (pathname.startsWith('/api/')) {
    // For API routes, we need to handle both with and without trailing slash
    const response = NextResponse.next()
    
    // Add CORS headers for API routes
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
    
    // Important: Return next() to prevent any redirects for API routes
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match API routes to prevent trailing slash redirects
    '/api/:path*'
  ]
}