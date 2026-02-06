import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle API routes - prevent trailing slash issues and enable proper routing
  const pathname = request.nextUrl.pathname;
  
  // Handle direct API calls (development and production)
  if (pathname.startsWith('/api/')) {
    // If the request has trailing slash, remove it (except for root API)
    if (pathname.endsWith('/') && pathname !== '/api/') {
      const newPath = pathname.slice(0, -1)
      const url = request.nextUrl.clone()
      url.pathname = newPath
      return NextResponse.rewrite(url)
    }
    // Allow the request to proceed
    return NextResponse.next()
  }
  
  // Handle basePath API calls (production with basePath)
  if (pathname.startsWith('/sm-admin/api/')) {
    // Remove trailing slash if present
    if (pathname.endsWith('/') && pathname !== '/sm-admin/api/') {
      const newPath = pathname.slice(0, -1)
      const url = request.nextUrl.clone()  
      url.pathname = newPath
      return NextResponse.rewrite(url)
    }
    // Rewrite to remove the basePath for API routes
    const apiPath = pathname.replace('/sm-admin', '')
    const url = request.nextUrl.clone()
    url.pathname = apiPath
    return NextResponse.rewrite(url)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match API routes with and without basePath
    '/api/:path*',
    '/sm-admin/api/:path*'
  ]
}