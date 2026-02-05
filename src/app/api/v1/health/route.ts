import { NextRequest, NextResponse } from 'next/server';

// GET /api/v1/health - Simple health check endpoint
export async function GET(request: NextRequest) {
  try {
    // Basic health check without complex authentication
    const basicHealth = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      authenticated: false,
      message: 'API is running'
    };

    // Try to load auth if possible
    try {
      const { authenticateRequest } = await import('@/utils/auth');
      const authResult = await authenticateRequest(request, ['read']);
      
      if (authResult) {
        basicHealth.authenticated = true;
        (basicHealth as any).authType = authResult.type;
        
        if (authResult.type === 'apikey') {
          const apiPayload = authResult.payload as any;
          (basicHealth as any).apiKey = {
            name: apiPayload.name,
            role: apiPayload.role,
            permissions: apiPayload.permissions
          };
        } else {
          const adminPayload = authResult.payload as any;
          (basicHealth as any).user = {
            email: adminPayload.email,
            role: adminPayload.role
          };
        }
      }
    } catch (authError) {
      console.error('Authentication check failed in health endpoint:', authError);
      // Continue with basic health response
    }

    return NextResponse.json(basicHealth);
    
  } catch (error) {
    console.error('Health check error:', error);
    
    // Return basic error response - this should never fail
    return new NextResponse(JSON.stringify({
      success: false,
      status: 'error',  
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Handle CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
}