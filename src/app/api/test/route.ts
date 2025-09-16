import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('Simple test API called');
  return NextResponse.json({
    message: 'Simple test API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    success: true
  });
}

export async function POST(request: NextRequest) {
  console.log('Simple test API POST called');
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'POST endpoint working',
      receivedData: body,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    return NextResponse.json({
      message: 'POST endpoint error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      success: false
    });
  }
}