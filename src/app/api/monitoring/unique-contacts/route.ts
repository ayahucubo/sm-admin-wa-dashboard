import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';
import { queryN8n } from '@/utils/database';

// Interface for daily unique contacts stats
interface DailyUniqueContactsStats {
  date: string;
  uniqueContacts: number;
}

// Interface for contact details on a specific date
interface ContactDetail {
  contactId: string;
  contactName: string;
  chatCount: number;
}

// Interface for the response
interface UniqueContactsResponse {
  success: boolean;
  data: DailyUniqueContactsStats[];
  period: {
    days: number;
    startDate: string | null;
    endDate: string | null;
  };
}

// Function to get unique contacts statistics aggregated by date
async function getUniqueContactsStats(days: number = 30): Promise<DailyUniqueContactsStats[]> {
  try {
    // For local development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log(`Returning mock unique contacts data for ${days} days (development mode)`);
      const mockData: DailyUniqueContactsStats[] = [];
      const endDate = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        mockData.push({
          date: date.toISOString().split('T')[0],
          uniqueContacts: Math.floor(Math.random() * 50) + 10 // Random number between 10-60
        });
      }
      
      return mockData;
    }
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    
    // Format dates for PostgreSQL
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`Fetching unique contacts stats from ${startDateStr} to ${endDateStr}`);

    // Query to get unique contacts per day
    const queryText = `
      WITH date_series AS (
        SELECT generate_series(
          $1::date,
          $2::date,
          '1 day'::interval
        )::date as date
      ),
      daily_contacts AS (
        SELECT
          DATE(ee."startedAt") as date,
          COUNT(DISTINCT COALESCE(em4.value, em.value)) as unique_contacts
        FROM
          execution_metadata em
        INNER JOIN execution_metadata em1 ON em1."executionId" = em."executionId" AND em1."key" = 'chatInput'
        INNER JOIN execution_metadata em2 ON em2."executionId" = em."executionId" AND em2.key = 'chatResponse'
        INNER JOIN execution_metadata em3 ON em3."executionId" = em."executionId" AND em3.key = 'currentMenu'
        LEFT JOIN execution_metadata em4 ON em4."executionId" = em."executionId" AND em4.key = 'chatName'
        INNER JOIN "execution_entity" ee ON ee.id = em."executionId"
        INNER JOIN workflow_entity we ON we.id = ee."workflowId"
        WHERE em."key" = 'chatId'
          AND DATE(ee."startedAt") >= $1
          AND DATE(ee."startedAt") <= $2
        GROUP BY DATE(ee."startedAt")
      )
      SELECT
        ds.date::text as date,
        COALESCE(dc.unique_contacts, 0) as unique_contacts
      FROM date_series ds
      LEFT JOIN daily_contacts dc ON ds.date = dc.date
      ORDER BY ds.date ASC
    `;

    const result = await queryN8n(queryText, [startDateStr, endDateStr]);

    return result.rows.map(row => ({
      date: row.date,
      uniqueContacts: parseInt(row.unique_contacts)
    }));

  } catch (error) {
    console.error('Error fetching unique contacts statistics:', error);
    throw error;
  }
}

// Function to get contact details for a specific date
async function getContactsForDate(date: string): Promise<ContactDetail[]> {
  try {
    // For local development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log(`Returning mock contact details for date: ${date} (development mode)`);
      const mockContacts: ContactDetail[] = [
        { contactId: '081234567890', contactName: 'John Doe', chatCount: 5 },
        { contactId: '081234567891', contactName: 'Jane Smith', chatCount: 3 },
        { contactId: '081234567892', contactName: 'Bob Johnson', chatCount: 7 },
        { contactId: '081234567893', contactName: 'Alice Brown', chatCount: 2 },
        { contactId: '081234567894', contactName: 'Charlie Wilson', chatCount: 4 }
      ];
      return mockContacts;
    }
    
    console.log(`Fetching contacts for date: ${date}`);

    const queryText = `
      SELECT
        COALESCE(em4.value, em.value) as contact_id,
        COALESCE(em4.value, em.value) as contact_name,
        COUNT(*) as chat_count
      FROM
        execution_metadata em
      INNER JOIN execution_metadata em1 ON em1."executionId" = em."executionId" AND em1."key" = 'chatInput'
      INNER JOIN execution_metadata em2 ON em2."executionId" = em."executionId" AND em2.key = 'chatResponse'
      INNER JOIN execution_metadata em3 ON em3."executionId" = em."executionId" AND em3.key = 'currentMenu'
      LEFT JOIN execution_metadata em4 ON em4."executionId" = em."executionId" AND em4.key = 'chatName'
      INNER JOIN "execution_entity" ee ON ee.id = em."executionId"
      INNER JOIN workflow_entity we ON we.id = ee."workflowId"
      WHERE em."key" = 'chatId'
        AND DATE(ee."startedAt") = $1
      GROUP BY COALESCE(em4.value, em.value)
      ORDER BY chat_count DESC, contact_name ASC
    `;

    const result = await queryN8n(queryText, [date]);

    return result.rows.map(row => ({
      contactId: row.contact_id,
      contactName: row.contact_name,
      chatCount: parseInt(row.chat_count)
    }));

  } catch (error) {
    console.error('Error fetching contacts for date:', error);
    throw error;
  }
}

// GET - Fetch daily unique contacts statistics
export async function GET(request: NextRequest) {
  try {
    console.log('💻 Unique contacts statistics API called');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    
    // Check authentication first
    const authPayload = await authenticateAdmin(request);
    if (!authPayload) {
      console.log('⚠️ Unauthorized access attempt blocked');
      return createUnauthorizedResponse('Access denied. Please login to view unique contacts statistics.');
    }
    
    console.log(`✅ Authenticated admin: ${authPayload.email}`);
    
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const dateParam = searchParams.get('date');
    
    // If requesting contact details for a specific date
    if (dateParam) {
      console.log(`Fetching contact details for date: ${dateParam}`);
      const contactDetails = await getContactsForDate(dateParam);
      
      return NextResponse.json({
        success: true,
        date: dateParam,
        contacts: contactDetails,
        total: contactDetails.length
      });
    }
    
    // Otherwise, return aggregated statistics
    const days = daysParam ? parseInt(daysParam) : 30; // Default to last 30 days
    console.log(`Fetching unique contacts statistics for last ${days} days`);
    
    const statsData = await getUniqueContactsStats(days);
    
    console.log(`Generated ${statsData.length} days of unique contacts statistics`);
    
    const response: UniqueContactsResponse = {
      success: true,
      data: statsData,
      period: {
        days,
        startDate: statsData.length > 0 ? statsData[0].date : null,
        endDate: statsData.length > 0 ? statsData[statsData.length - 1].date : null
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('💥 Unique contacts statistics API Error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch unique contacts statistics',
      details: 'Unable to generate unique contacts statistics',
      data: [],
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
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