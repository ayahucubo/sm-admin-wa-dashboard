import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';
import { getChatHistory, getChatHistoryCount } from '@/utils/database';
import { batchFetchCompanyCodes, createPhoneToCompanyMapping, CompanyCodeData } from '@/utils/sapApi';

// Interface for chat history item
interface ChatHistoryItem {
  execution_id: string;
  started_at: string;
  nohp: string;
  chat: string;
  chat_response: string;
  current_menu: string;
  chat_name: string | null;
  workflow_id: string;
  workflow_name: string;
}

// Interface for formatted response
interface FormattedChatHistoryItem {
  executionId: string;
  startedAt: string;
  contact: string;
  phoneNumber: string;
  chat: string;
  chatResponse: string;
  currentMenu: string;
  workflowId: string;
  workflowName: string;
  date: string;
  companyCode?: string;
  companyName?: string;
}

// GET - Fetch filtered chat history from database
export async function GET(request: NextRequest) {
  try {
    console.log('💬 Chat history API called');
    
    // Check authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      console.log('⚠️ Authentication failed');
      return createUnauthorizedResponse('Access denied. Please login to view chat history.');
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const currentMenu = searchParams.get('currentMenu') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const companyCode = searchParams.get('companyCode') || undefined; // New company code filter
    const includeCompanyData = searchParams.get('includeCompanyData') === 'true'; // Option to include company data
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    console.log('Chat history filters:', {
      currentMenu,
      startDate,
      endDate,
      companyCode,
      includeCompanyData,
      page,
      limit,
      offset
    });

    // Fetch chat history data from database
    const [chatHistoryData, totalCount] = await Promise.all([
      getChatHistory({
        currentMenu,
        startDate,
        endDate,
        limit,
        offset
      }),
      getChatHistoryCount({
        currentMenu,
        startDate,
        endDate
      })
    ]);

    console.log(`Fetched ${chatHistoryData.length} chat history items out of ${totalCount} total`);

    // Prepare company code mapping if needed
    let phoneToCompanyMapping = new Map<string, string>();
    let companyDataMap = new Map<string, CompanyCodeData>();
    
    if (includeCompanyData || companyCode) {
      // Get unique phone numbers from the current data
      const phoneNumbers = [...new Set(
        chatHistoryData
          .map((item: ChatHistoryItem) => item.nohp)
          .filter((phone: string) => phone && phone.trim() !== '')
      )];

      console.log(`Fetching company codes for ${phoneNumbers.length} unique phone numbers`);

      if (phoneNumbers.length > 0) {
        try {
          // Fetch company codes from SAP API
          const companyDataArray = await batchFetchCompanyCodes(phoneNumbers, 3);
          
          // Create mapping for quick lookup
          phoneToCompanyMapping = createPhoneToCompanyMapping(companyDataArray);
          
          // Create detailed company data map
          companyDataArray.forEach(data => {
            companyDataMap.set(data.phoneNumber, data);
          });
          
          console.log(`Company codes fetched: ${companyDataArray.filter(d => d.success).length} successful`);
        } catch (error) {
          console.error('Error fetching company codes:', error);
          // Continue without company data if SAP API fails
        }
      }
    }

    // Format the data for the frontend
    let formattedHistory: FormattedChatHistoryItem[] = chatHistoryData.map((item: ChatHistoryItem) => {
      const companyData = companyDataMap.get(item.nohp);
      
      return {
        executionId: item.execution_id,
        startedAt: item.started_at,
        contact: item.chat_name || item.nohp || 'Unknown',
        phoneNumber: item.nohp || '',
        chat: item.chat,
        chatResponse: item.chat_response,
        currentMenu: item.current_menu,
        workflowId: item.workflow_id,
        workflowName: item.workflow_name,
        date: item.started_at,
        companyCode: companyData?.companyCode,
        companyName: companyData?.companyName
      };
    });

    // Apply company code filter if specified
    if (companyCode) {
      formattedHistory = formattedHistory.filter(item => 
        item.companyCode === companyCode
      );
      console.log(`Filtered by company code '${companyCode}': ${formattedHistory.length} items remaining`);
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    const response = {
      success: true,
      data: formattedHistory,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      },
      filters: {
        currentMenu,
        startDate,
        endDate,
        companyCode
      },
      companyData: includeCompanyData ? {
        hasCompanyData: companyDataMap.size > 0,
        totalPhoneNumbers: phoneToCompanyMapping.size,
        uniqueCompanyCodes: [...new Set(Array.from(companyDataMap.values())
          .filter(d => d.success && 
                      d.companyCode !== 'ERROR' && 
                      d.companyCode !== 'UNKNOWN' &&
                      d.companyCode !== 'NOT_FOUND' &&
                      d.companyCode !== 'NO_DATA')
          .map(d => d.companyCode)
        )].sort()
      } : undefined
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Chat history API Error:', error);
    
    // Return structured error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chat history',
        details: 'Unable to retrieve chat history data from database',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}