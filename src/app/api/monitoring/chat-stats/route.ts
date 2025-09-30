import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';
import { query } from '@/utils/database';

// Interface for daily chat statistics
interface DailyChatStats {
  date: string;
  menuCounts: {
    'industrial relation': number;
    'jenny': number;
    'benefit': number;
    'company regulations': number;
    'promotion': number;
    'leave': number;
  };
  total: number;
}

// Generate mock data for demonstration (since external API doesn't store historical data locally)
function generateMockChatStats(days: number = 30): DailyChatStats[] {
  const menuTypes = ['industrial relation', 'jenny', 'benefit', 'company regulations', 'promotion', 'leave'];
  const stats: DailyChatStats[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const menuCounts = {
      'industrial relation': Math.floor(Math.random() * 20) + 5, // 5-24 chats
      'jenny': Math.floor(Math.random() * 15) + 3, // 3-17 chats
      'benefit': Math.floor(Math.random() * 25) + 8, // 8-32 chats
      'company regulations': Math.floor(Math.random() * 12) + 2, // 2-13 chats
      'promotion': Math.floor(Math.random() * 18) + 4, // 4-21 chats
      'leave': Math.floor(Math.random() * 22) + 6, // 6-27 chats
    };
    
    const total = Object.values(menuCounts).reduce((sum, count) => sum + count, 0);
    
    stats.push({
      date: dateStr,
      menuCounts,
      total
    });
  }
  
  return stats;
}

// GET - Fetch daily chat statistics
export async function GET(request: NextRequest) {
  try {
    console.log('Chat statistics API called');
    
    // Check authentication first
    const authPayload = await authenticateAdmin(request);
    if (!authPayload) {
      console.log('⚠️ Unauthorized access attempt blocked');
      return createUnauthorizedResponse('Access denied. Please login to view chat statistics.');
    }
    
    console.log(`✅ Authenticated admin: ${authPayload.email}`);
    
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 30; // Default to last 30 days
    
    console.log(`Fetching chat statistics for last ${days} days`);
    
    // For now, we'll use mock data since the external API doesn't provide historical aggregated data
    // In a real implementation, this would query a local database that stores chat history
    const mockStats = generateMockChatStats(days);
    
    console.log(`Generated ${mockStats.length} days of mock statistics`);
    
    return NextResponse.json({
      success: true,
      data: mockStats,
      period: {
        days,
        startDate: mockStats.length > 0 ? mockStats[0].date : null,
        endDate: mockStats.length > 0 ? mockStats[mockStats.length - 1].date : null
      },
      menuTypes: ['industrial relation', 'jenny', 'benefit', 'company regulations', 'promotion', 'leave']
    });
    
  } catch (error) {
    console.error('Chat statistics API Error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch chat statistics',
      details: 'Unable to generate chat statistics',
      data: []
    }, { status: 500 });
  }
}

// OPTIONS - Handle CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}