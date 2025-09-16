import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseConnection } from '../../../utils/database';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DATABASE HEALTH CHECK ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request URL:', request.url);
    
    const healthCheck = await checkDatabaseConnection();
    
    const response = {
      timestamp: new Date().toISOString(),
      apiEndpoint: '/api/health',
      ...healthCheck
    };

    if (healthCheck.success) {
      return NextResponse.json({
        status: 'healthy',
        message: 'Database connection successful',
        ...response
      }, { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        message: 'Database connection failed',
        ...response
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
    }
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      apiEndpoint: '/api/health',
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }
}