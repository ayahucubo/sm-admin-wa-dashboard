import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseConnection } from '../../../utils/database';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DATABASE HEALTH CHECK ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Timestamp:', new Date().toISOString());
    
    const healthCheck = await checkDatabaseConnection();
    
    if (healthCheck.success) {
      return NextResponse.json({
        status: 'healthy',
        message: 'Database connection successful',
        ...healthCheck
      }, { status: 200 });
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        message: 'Database connection failed',
        ...healthCheck
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
    }, { status: 500 });
  }
}