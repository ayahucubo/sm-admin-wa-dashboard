import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔧 Development test endpoint called');
  console.log('Environment:', process.env.NODE_ENV);
  
  return NextResponse.json({
    success: true,
    message: 'Development test endpoint working',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}