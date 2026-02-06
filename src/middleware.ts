import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Only handle API routes - remove trailing slash
  if (pathname.startsWith('/api/')) {
    // Remove trailing slash if present (nginx adds this)
    if (pathname.endsWith('/') && pathname !== '/api/') {
      const newPath = pathname.slice(0, -1)
      const url = request.nextUrl.clone()
      url.pathname = newPath
      
      console.log(`[MIDDLEWARE] Removing trailing slash: ${pathname} → ${newPath}`)
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