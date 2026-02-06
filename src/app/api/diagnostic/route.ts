import { NextRequest, NextResponse } from 'next/server';

// Simple diagnostic endpoint to test basic routing without dependencies
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    return NextResponse.json({
      success: true,
      status: 'diagnostic-ok',
      timestamp: new Date().toISOString(),
      endpoint: '/api/diagnostic',
      environment: process.env.NODE_ENV || 'unknown',
      url: {
        full: request.url,
        pathname: url.pathname,
        search: url.search,
        origin: url.origin
      },
      headers: {
        'user-agent': request.headers.get('user-agent'),
        'x-api-key': request.headers.get('x-api-key') ? 'present' : 'missing',
        'content-type': request.headers.get('content-type')
      },
      deployment: {
        buildTime: new Date().toISOString(),
        route: 'working',
        nextjs: 'operational'
      }
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Diagnostic': 'true'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: '/api/diagnostic',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}