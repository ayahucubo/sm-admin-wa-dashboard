import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';
import { getChatHistory, getChatHistoryCount } from '@/utils/database';

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
  chat: string;
  chatResponse: string;
  currentMenu: string;
  workflowId: string;
  workflowName: string;
  date: string;
}

// GET - Fetch filtered chat history from database
export async function GET(request: NextRequest) {
  try {
    console.log('💬 Chat history API called');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Request URL:', request.url);
    
    // For local development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Returning mock chat history data (development mode)');
      
      const mockData: FormattedChatHistoryItem[] = [
        {
          executionId: 'mock-exec-1',
          startedAt: new Date().toISOString(),
          contact: 'John Doe',
          chat: 'Saya ingin tahu tentang benefit kesehatan',
          chatResponse: 'Berikut adalah informasi tentang benefit kesehatan...',
          currentMenu: 'Benefit',
          workflowId: 'mock-workflow-1',
          workflowName: 'Mock Workflow',
          date: new Date().toISOString()
        },
        {
          executionId: 'mock-exec-2',
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          contact: 'Jane Smith',
          chat: 'Bagaimana cara mengajukan klaim?',
          chatResponse: 'Untuk mengajukan klaim, silakan ikuti langkah berikut...',
          currentMenu: 'Klaim',
          workflowId: 'mock-workflow-2',
          workflowName: 'Mock Workflow 2',
          date: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      return NextResponse.json({
        success: true,
        data: mockData,
        pagination: {
          page: 1,
          limit: 20,
          total: mockData.length,
          totalPages: 1
        },
        debug: {
          totalRecords: mockData.length,
          environment: 'development'
        }
      });
    }
    
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    console.log('Chat history filters:', {
      currentMenu,
      startDate,
      endDate,
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

    // Format the data for the frontend
    const formattedHistory: FormattedChatHistoryItem[] = chatHistoryData.map((item: ChatHistoryItem) => ({
      executionId: item.execution_id,
      startedAt: item.started_at,
      contact: item.chat_name || item.nohp || 'Unknown',
      chat: item.chat,
      chatResponse: item.chat_response,
      currentMenu: item.current_menu,
      workflowId: item.workflow_id,
      workflowName: item.workflow_name,
      date: item.started_at
    }));

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
        endDate
      }
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