import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';
import { fetchCompanyCodeFromSAP } from '@/utils/sapApi';

// Test endpoint to debug SAP API responses
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 SAP API Test endpoint called');
    
    // Check authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      return createUnauthorizedResponse('Access denied.');
    }

    // Get test phone number from query params
    const searchParams = request.nextUrl.searchParams;
    const testPhone = searchParams.get('phone') || '6287839400200'; // Use one from the logs

    console.log(`Testing SAP API with phone: ${testPhone}`);

    // Test SAP API call
    const result = await fetchCompanyCodeFromSAP(testPhone);

    return NextResponse.json({
      success: true,
      testPhone,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SAP API test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'SAP API test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST - Test with multiple phone numbers
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      return createUnauthorizedResponse('Access denied.');
    }

    const body = await request.json();
    const { phoneNumbers } = body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
      return NextResponse.json({
        success: false,
        error: 'phoneNumbers array is required'
      }, { status: 400 });
    }

    console.log(`Testing SAP API with ${phoneNumbers.length} phone numbers`);

    const results = [];
    for (const phone of phoneNumbers) {
      try {
        const result = await fetchCompanyCodeFromSAP(phone);
        results.push(result);
      } catch (error) {
        results.push({
          phoneNumber: phone,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        errors: results.filter(r => !r.success).length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SAP API batch test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'SAP API batch test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}