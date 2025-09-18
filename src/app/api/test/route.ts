import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';

export async function GET(request: NextRequest) {
  const authPayload = await authenticateAdmin(request);
  if (!authPayload) {
    return createUnauthorizedResponse();
  }

  console.log('Simple test API called');
  return NextResponse.json({
    message: 'Simple test API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    success: true,
    authenticatedUser: authPayload.email
  });
}

export async function POST(request: NextRequest) {
  const authPayload = await authenticateAdmin(request);
  if (!authPayload) {
    return createUnauthorizedResponse();
  }

  console.log('Simple test API POST called');
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'POST endpoint working',
      receivedData: body,
      timestamp: new Date().toISOString(),
      success: true,
      authenticatedUser: authPayload.email
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