import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';
import { getChatHistory } from '@/utils/database';
import { batchFetchCompanyCodes, getUniqueCompanyCodes, CompanyCodeData } from '@/utils/sapApi';

// Interface for the response
interface CompanyCodeResponse {
  success: boolean;
  data?: {
    companyData: CompanyCodeData[];
    uniqueCompanyCodes: string[];
    phoneNumbers: string[];
    stats: {
      total: number;
      successful: number;
      errors: number;
      unknown: number;
    };
  };
  error?: string;
  timestamp: string;
}

// GET - Fetch company codes for chat history phone numbers
export async function GET(request: NextRequest) {
  try {
    console.log('🏢 Company codes API called');
    
    // Check authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      console.log('⚠️ Authentication failed');
      return createUnauthorizedResponse('Access denied. Please login to fetch company codes.');
    }

    // Extract query parameters for filtering (same as chat history)
    const searchParams = request.nextUrl.searchParams;
    const currentMenu = searchParams.get('currentMenu') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '1000'); // Get more records for company mapping

    console.log('Company codes filters:', {
      currentMenu,
      startDate,
      endDate,
      limit
    });

    // Fetch chat history data to get phone numbers
    const chatHistoryData = await getChatHistory({
      currentMenu,
      startDate,
      endDate,
      limit,
      offset: 0
    });

    console.log(`Fetched ${chatHistoryData.length} chat history records for company code lookup`);

    // Extract unique phone numbers
    const phoneNumbers = [...new Set(
      chatHistoryData
        .map((item: any) => item.nohp)
        .filter((phone: string) => phone && phone.trim() !== '')
    )];

    console.log(`Found ${phoneNumbers.length} unique phone numbers to process`);

    if (phoneNumbers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          companyData: [],
          uniqueCompanyCodes: [],
          phoneNumbers: [],
          stats: {
            total: 0,
            successful: 0,
            errors: 0,
            unknown: 0
          }
        },
        timestamp: new Date().toISOString()
      } as CompanyCodeResponse);
    }

    // Batch fetch company codes from SAP API
    console.log('🔄 Starting batch fetch from SAP API...');
    const companyData = await batchFetchCompanyCodes(phoneNumbers, 3); // Limit to 3 concurrent requests

    // Get unique company codes for filtering
    const uniqueCompanyCodes = getUniqueCompanyCodes(companyData);

    // Calculate statistics
    const stats = {
      total: companyData.length,
      successful: companyData.filter(d => d.success && 
                                     !['UNKNOWN', 'ERROR', 'NOT_FOUND', 'NO_DATA'].includes(d.companyCode)).length,
      errors: companyData.filter(d => !d.success || d.companyCode === 'ERROR').length,
      unknown: companyData.filter(d => d.success && 
                                  ['UNKNOWN', 'NOT_FOUND', 'NO_DATA'].includes(d.companyCode)).length
    };

    console.log('✅ Company codes fetch completed:', stats);

    const response: CompanyCodeResponse = {
      success: true,
      data: {
        companyData,
        uniqueCompanyCodes,
        phoneNumbers,
        stats
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Company codes API Error:', error);
    
    const response: CompanyCodeResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch company codes',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST - Manually trigger company code refresh for specific phone numbers
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual company codes refresh triggered');
    
    // Check authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      return createUnauthorizedResponse('Access denied. Please login to refresh company codes.');
    }

    const body = await request.json();
    const { phoneNumbers } = body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Phone numbers array is required',
        timestamp: new Date().toISOString()
      } as CompanyCodeResponse, { status: 400 });
    }

    console.log(`Manual refresh for ${phoneNumbers.length} phone numbers`);

    // Fetch company codes for specified phone numbers
    const companyData = await batchFetchCompanyCodes(phoneNumbers, 3);
    const uniqueCompanyCodes = getUniqueCompanyCodes(companyData);

    const stats = {
      total: companyData.length,
      successful: companyData.filter(d => d.success && 
                                     !['UNKNOWN', 'ERROR', 'NOT_FOUND', 'NO_DATA'].includes(d.companyCode)).length,
      errors: companyData.filter(d => !d.success || d.companyCode === 'ERROR').length,
      unknown: companyData.filter(d => d.success && 
                                  ['UNKNOWN', 'NOT_FOUND', 'NO_DATA'].includes(d.companyCode)).length
    };

    const response: CompanyCodeResponse = {
      success: true,
      data: {
        companyData,
        uniqueCompanyCodes,
        phoneNumbers,
        stats
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Manual company codes refresh error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh company codes',
      timestamp: new Date().toISOString()
    } as CompanyCodeResponse, { status: 500 });
  }
}