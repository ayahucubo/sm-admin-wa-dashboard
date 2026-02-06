import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Handle API routes - both with and without trailing slash
  if (pathname.startsWith('/api/')) {
    // If path doesn't end with /, redirect to trailing slash version (to match nginx)
    if (!pathname.endsWith('/') && pathname !== '/api') {
      const url = request.nextUrl.clone()
      url.pathname = pathname + '/'
      console.log(`[MIDDLEWARE] Adding trailing slash: ${pathname} → ${url.pathname}`)
      return NextResponse.redirect(url, 308) // Permanent redirect like nginx
    }
    
    // If path ends with /, rewrite to version without trailing slash for API processing
    if (pathname.endsWith('/') && pathname !== '/api/') {
      const cleanPath = pathname.slice(0, -1)
      const url = request.nextUrl.clone()
      url.pathname = cleanPath
      console.log(`[MIDDLEWARE] Processing API: ${pathname} → ${cleanPath}`)
      return NextResponse.rewrite(url)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only match API routes
    '/api/:path*'
  ]
}