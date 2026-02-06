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
    
    // Basic response first
    const apiInfo: any = {
      success: true,
      name: 'Sinar Mas Mining Admin Dashboard API',
      version: 'v1.0.0',
      description: 'RESTful API for managing feedback data, chat history, and admin dashboard functions',
      timestamp: new Date().toISOString(),
      authenticated: false,
      authType: null,
    };

    // Try authentication check but don't fail if it doesn't work
    let authResult = null;
    try {
      authResult = await authenticateRequest(request, ['read']);
      if (authResult) {
        apiInfo.authenticated = true;
        apiInfo.authType = authResult.type;
        
        // Only log auth result in development
        if (process.env.NODE_ENV !== 'production') {
          console.log('Auth Result:', authResult);
        }
      }
    } catch (authError) {
      console.warn('Auth check failed in /api/v1:', authError);
      apiInfo.authWarning = 'Authentication check failed but continuing with basic response';
    }

    // Add endpoint information
    apiInfo.authentication = {
      methods: ['API Key', 'Admin Token'],
      headers: {
        apiKey: 'X-API-Key: <your-api-key>',
        adminToken: 'Authorization: Bearer <admin-token>'
      },
      permissions: ['read', 'write', 'delete']
    };
    
    apiInfo.endpoints = {
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
          GET: ['read'], 
          POST: ['write'], 
          PUT: ['write'], 
          DELETE: ['delete']
        }
      },
      feedbackHistory: {
        path: '/api/v1/feedback/history',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Manage feedback history records',
        authentication: 'Required',
        features: ['pagination', 'filtering', 'sorting', 'statistics'],
        permissions: {
          GET: ['read'], 
          POST: ['write'], 
          PUT: ['write'], 
          DELETE: ['delete']
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
        feedbackRating: {
          path: '/api/monitoring/feedback-rating',
          methods: ['GET'],
          description: 'Legacy feedback monitoring API (updated with API key support)',
          authentication: 'Required',
          note: 'Maintained for backward compatibility'
        },
        chatHistory: {
          path: '/api/monitoring/chat-history',
          methods: ['GET'],
          description: 'Legacy chat history API (updated with API key support)',
          authentication: 'Required',
          note: 'Maintained for backward compatibility'
        }
      }
    };

    apiInfo.features = {
      authentication: ['Admin Token', 'API Key'],
      dataFormats: ['JSON'],
      cors: 'Enabled for all origins',
      filtering: 'Multiple filter options per endpoint',
      pagination: 'Standard page/limit parameters',
      sorting: 'Configurable sort fields and order',
      validation: 'Input validation and sanitization'
    };

    apiInfo.documentation = 'See API_DOCUMENTATION.md for detailed usage examples';
    
    apiInfo.support = {
      contact: 'System Administrator',
      environment: process.env.NODE_ENV || 'development'
    };

    // Add user-specific information if authenticated
    if (apiInfo.authenticated && authResult) {
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
    
    return NextResponse.json(apiInfo, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
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
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Handle CORS preflight
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