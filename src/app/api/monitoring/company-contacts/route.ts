import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';
import { getChatHistory } from '@/utils/database';
import { batchFetchCompanyCodes, createPhoneToCompanyMapping, CompanyCodeData } from '@/utils/sapApi';

// Interface for company contact stats
interface CompanyContactStats {
  companyCode: string;
  companyName: string;
  uniqueContacts: number;
  phoneNumbers: string[];
  lastContact: string;
}

// Interface for API response
interface CompanyContactsResponse {
  success: boolean;
  data: CompanyContactStats[];
  summary: {
    totalCompanies: number;
    totalUniqueContacts: number;
    dataGeneratedAt: string;
  };
  error?: string;
}

// GET - Fetch company contact statistics
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Company contacts API called');
    
    // Add a processing timeout
    const startTime = Date.now();
    const PROCESSING_TIMEOUT = 25000; // 25 seconds (less than 30s client timeout)
    
    // Check authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      console.log('⚠️ Authentication failed');
      return createUnauthorizedResponse('Access denied. Please login to view company contact data.');
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const includePhoneNumbers = searchParams.get('includePhoneNumbers') === 'true';
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`Fetching company contact data for ${days} days (${startDateStr} to ${endDateStr})`);

    // Fetch all chat history data within date range
    const chatHistoryData = await getChatHistory({
      startDate: startDateStr,
      endDate: endDateStr,
      limit: 50000, // Large limit to get all data
      offset: 0
    });

    console.log(`Fetched ${chatHistoryData.length} chat history records`);

    // Get unique phone numbers
    const uniquePhoneNumbers = [...new Set(
      chatHistoryData
        .map(item => item.nohp)
        .filter(phone => phone && phone.trim() !== '')
    )];

    console.log(`Found ${uniquePhoneNumbers.length} unique phone numbers`);

    // Fetch company data for all phone numbers
    let companyDataMap = new Map<string, CompanyCodeData>();
    
    if (uniquePhoneNumbers.length > 0) {
      try {
        console.log('Fetching company data from SAP API...');
        
        // Limit the number of phone numbers to process to prevent timeout
        const maxPhoneNumbers = 1000; // Limit to 1000 phone numbers to prevent timeout
        const phoneNumbersToProcess = uniquePhoneNumbers.slice(0, maxPhoneNumbers);
        
        console.log(`Processing ${phoneNumbersToProcess.length} phone numbers (limited from ${uniquePhoneNumbers.length} total)`);
        
        // Check if we're approaching timeout
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > PROCESSING_TIMEOUT) {
          console.log(`⚠️ Processing timeout approaching (${elapsedTime}ms), skipping SAP API calls`);
          throw new Error('Processing timeout - skipping SAP API calls');
        }
        
        // Use smaller batch size for better performance
        const companyDataArray = await batchFetchCompanyCodes(phoneNumbersToProcess, 2); // Reduce concurrency from 3 to 2
        
        // Create detailed company data map
        companyDataArray.forEach(data => {
          companyDataMap.set(data.phoneNumber, data);
        });
        
        console.log(`Company data fetched: ${companyDataArray.filter(d => d.success).length} successful out of ${phoneNumbersToProcess.length} processed`);
      } catch (error) {
        console.error('Error fetching company codes:', error);
        // Continue with empty company data if SAP API fails
      }
    }

    // Group contacts by company
    const companyContactsMap = new Map<string, {
      companyCode: string;
      companyName: string;
      phoneNumbers: Set<string>;
      lastContact: string;
    }>();

    // Process each chat record
    chatHistoryData.forEach(item => {
      const phoneNumber = item.nohp;
      const companyData = companyDataMap.get(phoneNumber);
      
      if (companyData && companyData.success && 
          companyData.companyCode !== 'ERROR' && 
          companyData.companyCode !== 'UNKNOWN' &&
          companyData.companyCode !== 'NOT_FOUND' &&
          companyData.companyCode !== 'NO_DATA') {
        
        const companyKey = `${companyData.companyCode}|${companyData.companyName}`;
        
        if (!companyContactsMap.has(companyKey)) {
          companyContactsMap.set(companyKey, {
            companyCode: companyData.companyCode,
            companyName: companyData.companyName,
            phoneNumbers: new Set(),
            lastContact: item.started_at
          });
        }
        
        const companyStats = companyContactsMap.get(companyKey)!;
        companyStats.phoneNumbers.add(phoneNumber);
        
        // Update last contact if this record is more recent
        if (new Date(item.started_at) > new Date(companyStats.lastContact)) {
          companyStats.lastContact = item.started_at;
        }
      }
    });

    // If we have no company data from SAP, create a fallback response
    if (companyContactsMap.size === 0) {
      console.log('⚠️ No company data found from SAP API, creating fallback response');
      
      // Group phone numbers and create basic stats without company names
      const phoneNumberCounts = new Map<string, Set<string>>();
      
      chatHistoryData.forEach(item => {
        const phoneNumber = item.nohp;
        if (phoneNumber && phoneNumber.trim() !== '') {
          const key = 'UNKNOWN|Unknown Company';
          if (!phoneNumberCounts.has(key)) {
            phoneNumberCounts.set(key, new Set());
          }
          phoneNumberCounts.get(key)!.add(phoneNumber);
        }
      });
      
      // Add the unknown company data
      if (phoneNumberCounts.size > 0) {
        const unknownPhones = phoneNumberCounts.get('UNKNOWN|Unknown Company')!;
        companyContactsMap.set('UNKNOWN|Unknown Company', {
          companyCode: 'UNKNOWN',
          companyName: 'Unknown Company (SAP data unavailable)',
          phoneNumbers: unknownPhones,
          lastContact: chatHistoryData[0]?.started_at || new Date().toISOString()
        });
      }
    }

    // Convert to array format for response
    const companyContactStats: CompanyContactStats[] = Array.from(companyContactsMap.values())
      .map(stats => ({
        companyCode: stats.companyCode,
        companyName: stats.companyName,
        uniqueContacts: stats.phoneNumbers.size,
        phoneNumbers: includePhoneNumbers ? Array.from(stats.phoneNumbers) : [],
        lastContact: stats.lastContact
      }))
      .sort((a, b) => b.uniqueContacts - a.uniqueContacts); // Sort by contact count (descending)

    // Calculate summary stats
    const totalUniqueContacts = Array.from(companyContactsMap.values())
      .reduce((sum, stats) => sum + stats.phoneNumbers.size, 0);

    const response: CompanyContactsResponse = {
      success: true,
      data: companyContactStats,
      summary: {
        totalCompanies: companyContactStats.length,
        totalUniqueContacts,
        dataGeneratedAt: new Date().toISOString()
      }
    };

    console.log(`✅ Company contacts aggregated: ${companyContactStats.length} companies, ${totalUniqueContacts} unique contacts`);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Company contacts API Error:', error);
    
    // Return structured error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch company contact data',
        details: 'Unable to retrieve company contact statistics',
        timestamp: new Date().toISOString(),
        data: [],
        summary: {
          totalCompanies: 0,
          totalUniqueContacts: 0,
          dataGeneratedAt: new Date().toISOString()
        }
      } as CompanyContactsResponse,
      { status: 500 }
    );
  }
}