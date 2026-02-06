import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== BASIC HEALTH CHECK ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request URL:', request.url);
    
    // Simple health check without database dependency first
    const basicResponse: any = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      apiEndpoint: '/api/health',
      environment: process.env.NODE_ENV || 'unknown',
      service: 'Basic Health Check'
    };

    // Try database check if possible, but don't fail if it doesn't work
    try {
      const { checkDatabaseConnection } = await import('../../../utils/database');
      const healthCheck = await checkDatabaseConnection();
      
      if (healthCheck.success) {
        basicResponse.database = 'connected';
        basicResponse.dbDetails = healthCheck;
      } else {
        basicResponse.database = 'disconnected';
        basicResponse.dbError = healthCheck.error;
      }
    } catch (dbError) {
      console.warn('Database check failed:', dbError);
      basicResponse.database = 'unavailable';
      basicResponse.dbError = dbError instanceof Error ? dbError.message : 'Database check failed';
    }

    return NextResponse.json(basicResponse, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      }
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      success: false,
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