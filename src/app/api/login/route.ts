import { NextRequest, NextResponse } from 'next/server';

// Login endpoint that integrates with N8N webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Log for debugging
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Timestamp:', new Date().toISOString());

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Missing credentials',
        message: 'Email and password are required'
      }, { status: 400 });
    }

    // Call N8N webhook for authentication
    const n8nWebhookUrl = 'https://wecare.techconnect.co.id/webhook-test/100/app/api/login';
    
    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        timeout: 10000 // 10 second timeout
      });

      if (!n8nResponse.ok) {
        console.error('N8N webhook failed:', n8nResponse.status, n8nResponse.statusText);
        return NextResponse.json({
          success: false,
          error: 'Authentication service unavailable',
          message: 'Please try again later'
        }, { status: 503 });
      }

      const authResult = await n8nResponse.json();
      console.log('N8N Auth Result:', authResult.success ? 'Success' : 'Failed');

      if (authResult.success && authResult.token) {
        // Successful authentication
        return NextResponse.json({
          success: true,
          token: authResult.token,
          user: {
            email: email,
            role: 'admin'
          },
          message: 'Login successful'
        }, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `admin_token=${authResult.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400` // 24 hours
          }
        });
      } else {
        // Failed authentication
        return NextResponse.json({
          success: false,
          error: 'Invalid credentials',
          message: authResult.message || 'Invalid email or password'
        }, { status: 401 });
      }

    } catch (n8nError) {
      console.error('N8N webhook error:', n8nError);
      return NextResponse.json({
        success: false,
        error: 'Authentication service error',
        message: 'Unable to validate credentials. Please try again.'
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Login endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred during login'
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}