import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Handle basePath API calls first (production with basePath)
  if (pathname.startsWith('/sm-admin/api/')) {
    // Extract the API path without basePath
    const apiPath = pathname.replace('/sm-admin', '')
    
    // Remove trailing slash if present (except for root API)
    const cleanApiPath = (apiPath.endsWith('/') && apiPath !== '/api/') 
      ? apiPath.slice(0, -1) 
      : apiPath;
    
    // Rewrite to internal API route
    const url = request.nextUrl.clone()
    url.pathname = cleanApiPath
    
    // Log for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] Rewriting: ${pathname} → ${cleanApiPath}`)
    }
    
    return NextResponse.rewrite(url)
  }
  
  // Handle direct API calls (development and production)
  if (pathname.startsWith('/api/')) {
    // Remove trailing slash if present (except for root API)
    if (pathname.endsWith('/') && pathname !== '/api/') {
      const newPath = pathname.slice(0, -1)
      const url = request.nextUrl.clone()
      url.pathname = newPath
      return NextResponse.redirect(url)
    }
    
    // Allow the request to proceed
    return NextResponse.next()
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