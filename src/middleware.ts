import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Handle API routes - both with and without basePath
  const isApiRoute = pathname.startsWith('/api/') || 
                     pathname.startsWith('/sm-admin/app/api/') ||
                     pathname.includes('/app/api/')
  
  if (isApiRoute) {
    const response = NextResponse.next()
    
    // Add CORS headers for API routes
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, x-api-key')
    
    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all API routes variations
    '/api/:path*',
    '/sm-admin/app/api/:path*',
    '/((?!_next|_static|favicon.ico).*)',
  ]
}