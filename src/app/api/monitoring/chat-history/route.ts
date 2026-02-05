import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';
import api from '@/utils/api';

// Interface for chat history item matching the external API structure
interface ChatHistoryItem {
  execution_id: string;
  started_at: string;
  chat: string;
  chat_response: string;
  current_menu: string;
  workflow_id: string;
  workflow_name: string;
  nohp?: string;
  chatname?: string;
}

// Interface for the response we'll send to the frontend
interface FormattedChatHistoryItem {
  executionId: string;
  startedAt: string;
  chat: string;
  chatResponse: string;
  currentMenu: string;
  workflowId: string;
  workflowName: string;
  contact: string;
  date: string;
}

/**
 * Fetch all chat history from external API
 * This function calls the external API multiple times to get comprehensive data
 */
async function fetchAllChatHistory(
  menuFilter?: string[],
  startDate?: string,
  endDate?: string
): Promise<FormattedChatHistoryItem[]> {
  try {
    console.log('Fetching all chat history with filters:', { menuFilter, startDate, endDate });

    // First, get all active chats to get the list of phone numbers
    const activeChatsResponse = await api.get('/api/chat/active');
    const activeChats = activeChatsResponse.data;
    
    console.log(`Found ${activeChats.length} active chats`);

    // For each active chat, fetch their complete history
    const allHistory: ChatHistoryItem[] = [];
    
    // Process chats in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < activeChats.length; i += batchSize) {
      const batch = activeChats.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (chat: any) => {
        try {
          const params: any = { nohp: chat.nohp };
          if (startDate) params.start = startDate;
          if (endDate) params.end = endDate;
          
          const historyResponse = await api.get('/api/chat/history', { params });
          
          // Add contact info to each history item
          return historyResponse.data.map((item: ChatHistoryItem) => ({
            ...item,
            nohp: chat.nohp,
            chatname: chat.chatname
          }));
        } catch (error) {
          console.warn(`Failed to fetch history for ${chat.nohp}:`, error);
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        if (Array.isArray(result)) {
          allHistory.push(...result);
        }
      });
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < activeChats.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Fetched ${allHistory.length} total chat history items`);

    // Apply menu filtering if specified
    let filteredHistory = allHistory;
    if (menuFilter && menuFilter.length > 0) {
      filteredHistory = allHistory.filter(item => 
        menuFilter.includes(item.current_menu)
      );
      console.log(`After menu filter: ${filteredHistory.length} items`);
    }

    // Format the data for the frontend
    const formattedHistory: FormattedChatHistoryItem[] = filteredHistory.map(item => ({
      executionId: item.execution_id,
      startedAt: item.started_at,
      chat: item.chat,
      chatResponse: item.chat_response,
      currentMenu: item.current_menu,
      workflowId: item.workflow_id,
      workflowName: item.workflow_name,
      contact: item.chatname || item.nohp || 'Unknown',
      date: item.started_at
    }));

    // Sort by date descending (newest first)
    formattedHistory.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return formattedHistory;
  } catch (error) {
    console.error('Error fetching all chat history:', error);
    throw error;
  }
}

// GET - Fetch filtered chat history for admin (Updated with API key support)
export async function GET(request: NextRequest) {
  try {
    console.log('Chat history API called');
    
    // Check authentication - now supports both admin tokens and API keys
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      console.log('Authentication failed');
      return createUnauthorizedResponse('Access denied. Please login to view chat history.');
    }

    console.log(`Chat History API accessed by: ${authResult.email}`);

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const menuParam = searchParams.get('menu');
    const menuFilter = menuParam ? menuParam.split(',').filter(Boolean) : undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('Chat history filters:', {
      menuFilter,
      startDate,
      endDate,
      page,
      limit
    });

    // Fetch all chat history from external API
    const allHistory = await fetchAllChatHistory(menuFilter, startDate, endDate);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedHistory = allHistory.slice(startIndex, startIndex + limit);

    const response = {
      success: true,
      data: paginatedHistory,
      pagination: {
        page,
        limit,
        total: allHistory.length,
        totalPages: Math.ceil(allHistory.length / limit)
      },
      filters: {
        menuFilter,
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
        details: 'Unable to retrieve chat history data from external API',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle CORS for compatibility
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
}