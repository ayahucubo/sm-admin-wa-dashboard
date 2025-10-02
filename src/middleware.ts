import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle API routes - prevent trailing slash redirects
  if (request.nextUrl.pathname.startsWith('/sm-admin/api/')) {
    // If the request already has trailing slash, remove it
    if (request.nextUrl.pathname.endsWith('/') && request.nextUrl.pathname !== '/sm-admin/api/') {
      const newPath = request.nextUrl.pathname.slice(0, -1)
      const url = request.nextUrl.clone()
      url.pathname = newPath
      return NextResponse.rewrite(url)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/sm-admin/api/:path*'
  ]
}