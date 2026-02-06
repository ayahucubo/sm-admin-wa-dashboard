import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/utils/auth';

// GET /api/v1 - API Information and Available Endpoints
export async function GET(request: NextRequest) {
  try {
    // Only log in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== API INFO ENDPOINT DEBUG ===');
      console.log('Request URL:', request.url);
      console.log('NODE_ENV:', process.env.NODE_ENV);
    }
    
    // Check if user is authenticated (optional for this endpoint)
    const authResult = await authenticateRequest(request, ['read']);
    const isAuthenticated = !!authResult;
    
    // Only log auth result in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Auth Result:', authResult);
      console.log('Is Authenticated:', isAuthenticated);
    }

    const apiInfo: any = {
      success: true,
      name: 'Sinar Mas Mining Admin Dashboard API',
      version: 'v1.0.0',
      description: 'RESTful API for managing feedback data, chat history, and admin dashboard functions',
      timestamp: new Date().toISOString(),
      authenticated: isAuthenticated,
      authType: authResult?.type || null,
      authentication: {
        methods: ['API Key', 'Admin Token'],
        headers: {
          apiKey: 'X-API-Key: <your-api-key>',
          adminToken: 'Authorization: Bearer <admin-token>'
        },
        permissions: ['read', 'write', 'delete']
      },
      endpoints: {
        health: {
          path: '/api/v1/health',
          methods: ['GET'],
          description: 'API health check and authentication test',
          authentication: 'Optional',
          features: ['system-status', 'auth-validation']
        },
        feedbackTracker: {
          path: '/api/v1/feedback/tracker',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'Manage feedback tracker records',
          authentication: 'Required',
          features: ['pagination', 'filtering', 'sorting'],
          permissions: {
            GET: ['read'], POST: ['write'], PUT: ['write'], DELETE: ['delete']
          }
        },
        feedbackHistory: {
          path: '/api/v1/feedback/history',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'Manage feedback history records',
          authentication: 'Required',
          features: ['pagination', 'filtering', 'sorting', 'statistics'],
          permissions: {
            GET: ['read'], POST: ['write'], PUT: ['write'], DELETE: ['delete']
          }
        },
        chatHistory: {
          path: '/api/v1/chat',
          methods: ['GET'],
          description: 'Get comprehensive chat history with advanced filtering',
          authentication: 'Required',
          features: ['pagination', 'filtering', 'sorting', 'search', 'statistics'],
          queryParams: ['page', 'limit', 'menu', 'contact', 'startDate', 'endDate', 'search', 'includeStatistics']
        },
        activeChats: {
          path: '/api/v1/chat/active',
          methods: ['GET'],
          description: 'Get list of active chat contacts',
          authentication: 'Required',
          features: ['pagination', 'filtering', 'sorting', 'summary'],
          queryParams: ['page', 'limit', 'status', 'search', 'sortBy', 'includeSummary']
        },
        individualChat: {
          path: '/api/v1/chat/[phoneNumber]',
          methods: ['GET'],
          description: 'Get individual chat history by phone number',
          authentication: 'Required',
          features: ['pagination', 'filtering', 'statistics', 'contact-info'],
          queryParams: ['page', 'limit', 'startDate', 'endDate', 'menu', 'includeStatistics']
        },
        legacyApis: {
          '/api/monitoring/feedback-rating': {
            methods: ['GET'],
            description: 'Legacy feedback monitoring API (updated with API key support)',
            authentication: 'Required',
            note: 'Maintained for backward compatibility'
          },
          '/api/monitoring/chat-history': {
            methods: ['GET'],
            description: 'Legacy chat history API (updated with API key support)',
            authentication: 'Required',
            note: 'Maintained for backward compatibility'
          }
        }
      },
      features: {
        authentication: ['Admin Token', 'API Key'],
        dataFormats: ['JSON'],
        cors: 'Enabled for all origins',
        filtering: 'Multiple filter options per endpoint',
        pagination: 'Standard page/limit parameters',
        sorting: 'Configurable sort fields and order',
        validation: 'Input validation and sanitization'
      },
      documentation: 'See API_DOCUMENTATION.md for detailed usage examples',
      support: {
        contact: 'System Administrator',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // Add user-specific information if authenticated
    if (isAuthenticated && authResult) {
      if (authResult.type === 'admin') {
        const adminPayload = authResult.payload as any;
        apiInfo.user = {
          type: 'Admin User',
          email: adminPayload.email,
          role: adminPayload.role,
          permissions: ['read', 'write', 'delete', 'admin']
        };
      } else if (authResult.type === 'apikey') {
        const apiPayload = authResult.payload as any;
        apiInfo.apiKey = {
          type: 'API Key',
          name: apiPayload.name,
          role: apiPayload.role,
          permissions: apiPayload.permissions,
          keyId: apiPayload.keyId
        };
      }
    }

    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? ['https://wecare.techconnect.co.id'] 
      : ['*'];
    
    return NextResponse.json(apiInfo, {
      headers: {
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
          ? 'https://wecare.techconnect.co.id' 
          : '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    });

  } catch (error) {
    console.error('Error in API info endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve API information',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Handle CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? 'https://wecare.techconnect.co.id' 
        : '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    },
  });
}