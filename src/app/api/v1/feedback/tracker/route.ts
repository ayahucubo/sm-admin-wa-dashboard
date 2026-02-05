import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/utils/auth';
import { query } from '@/utils/database';

// Interface for feedback tracker item
interface FeedbackTracker {
  userId: string;
  lastChatTimestamp: string;
  feedbackSent: boolean;
  feedbackRating: number | null;
  feedbackReason: string | null;
  createdAt: string;
  updatedAt: string;
  xid: string | null;
  channelId: string | null;
  accountId: string | null;
  chatOrigin: string;
  lastFeedbackTime: string | null;
}

// Interface for API response
interface FeedbackTrackerResponse {
  success: boolean;
  data: FeedbackTracker[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters?: {
    userId?: string;
    chatOrigin?: string;
    feedbackSent?: boolean;
    startDate?: string;
    endDate?: string;
  };
}

// GET /api/v1/feedback/tracker - Get feedback tracker records
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request, ['read']);
    if (!authResult) {
      return createUnauthorizedResponse();
    }

    console.log(`API accessed by: ${authResult.type === 'admin' ? 'Admin User' : 'API Key'}`);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 items per page
    const userId = searchParams.get('userId');
    const chatOrigin = searchParams.get('chatOrigin');
    const feedbackSent = searchParams.get('feedbackSent');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'last_chat_timestamp';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid page parameter. Must be a positive integer.' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid limit parameter. Must be between 1 and 100.' },
        { status: 400 }
      );
    }

    // Validate sort parameters
    const validSortFields = ['user_id', 'last_chat_timestamp', 'feedback_sent', 'feedback_rating', 'created_at', 'updated_at', 'last_feedback_time'];
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        { success: false, error: `Invalid sortBy parameter. Must be one of: ${validSortFields.join(', ')}` },
        { status: 400 }
      );
    }

    if (!['asc', 'desc'].includes(sortOrder.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Invalid sortOrder parameter. Must be "asc" or "desc".' },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    // Build dynamic query with filters
    let queryText = `
      SELECT 
        user_id,
        last_chat_timestamp,
        feedback_sent,
        feedback_rating,
        feedback_reason,
        created_at,
        updated_at,
        xid,
        channel_id,
        account_id,
        chat_origin,
        last_feedback_time
      FROM n8n_feedback_tracker
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;

    // Add filters
    if (userId) {
      paramCount++;
      queryText += ` AND user_id = $${paramCount}`;
      params.push(userId);
    }

    if (chatOrigin) {
      paramCount++;
      queryText += ` AND chat_origin = $${paramCount}`;
      params.push(chatOrigin);
    }

    if (feedbackSent !== null && feedbackSent !== undefined) {
      paramCount++;
      queryText += ` AND feedback_sent = $${paramCount}`;
      params.push(feedbackSent === 'true');
    }

    if (startDate) {
      paramCount++;
      queryText += ` AND last_chat_timestamp >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      queryText += ` AND last_chat_timestamp <= $${paramCount}`;
      params.push(endDate + ' 23:59:59'); // Include full end date
    }

    // Add sorting and pagination
    queryText += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM n8n_feedback_tracker WHERE 1=1`;
    const countParams: any[] = [];
    let countParamCount = 0;

    // Apply same filters to count query
    if (userId) {
      countParamCount++;
      countQuery += ` AND user_id = $${countParamCount}`;
      countParams.push(userId);
    }

    if (chatOrigin) {
      countParamCount++;
      countQuery += ` AND chat_origin = $${countParamCount}`;
      countParams.push(chatOrigin);
    }

    if (feedbackSent !== null && feedbackSent !== undefined) {
      countParamCount++;
      countQuery += ` AND feedback_sent = $${countParamCount}`;
      countParams.push(feedbackSent === 'true');
    }

    if (startDate) {
      countParamCount++;
      countQuery += ` AND last_chat_timestamp >= $${countParamCount}`;
      countParams.push(startDate);
    }

    if (endDate) {
      countParamCount++;
      countQuery += ` AND last_chat_timestamp <= $${countParamCount}`;
      countParams.push(endDate + ' 23:59:59');
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Format the data
    const trackerData: FeedbackTracker[] = result.rows.map(row => ({
      userId: row.user_id,
      lastChatTimestamp: row.last_chat_timestamp,
      feedbackSent: row.feedback_sent,
      feedbackRating: row.feedback_rating,
      feedbackReason: row.feedback_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      xid: row.xid,
      channelId: row.channel_id,
      accountId: row.account_id,
      chatOrigin: row.chat_origin,
      lastFeedbackTime: row.last_feedback_time
    }));

    const response: FeedbackTrackerResponse = {
      success: true,
      data: trackerData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        userId: userId || undefined,
        chatOrigin: chatOrigin || undefined,
        feedbackSent: feedbackSent ? feedbackSent === 'true' : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in feedback tracker API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch feedback tracker data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/feedback/tracker - Create or update feedback tracker
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request with write permission
    const authResult = await authenticateRequest(request, ['write']);
    if (!authResult) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    const {
      userId,
      lastChatTimestamp,
      feedbackSent = false,
      feedbackRating,
      feedbackReason,
      xid,
      channelId,
      accountId,
      chatOrigin,
      lastFeedbackTime
    } = body;

    // Validate required fields
    if (!userId || !chatOrigin) {
      return NextResponse.json(
        { success: false, error: 'userId and chatOrigin are required fields.' },
        { status: 400 }
      );
    }

    // Insert or update tracker record
    const queryText = `
      INSERT INTO n8n_feedback_tracker (
        user_id, last_chat_timestamp, feedback_sent, feedback_rating, 
        feedback_reason, xid, channel_id, account_id, chat_origin, 
        last_feedback_time, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      )
      ON CONFLICT (user_id, chat_origin) 
      DO UPDATE SET
        last_chat_timestamp = EXCLUDED.last_chat_timestamp,
        feedback_sent = EXCLUDED.feedback_sent,
        feedback_rating = EXCLUDED.feedback_rating,
        feedback_reason = EXCLUDED.feedback_reason,
        xid = EXCLUDED.xid,
        channel_id = EXCLUDED.channel_id,
        account_id = EXCLUDED.account_id,
        last_feedback_time = EXCLUDED.last_feedback_time,
        updated_at = NOW()
      RETURNING *
    `;

    const params = [
      userId,
      lastChatTimestamp || new Date().toISOString(),
      feedbackSent,
      feedbackRating,
      feedbackReason,
      xid,
      channelId,
      accountId,
      chatOrigin,
      lastFeedbackTime
    ];

    const result = await query(queryText, params);

    return NextResponse.json({
      success: true,
      message: 'Feedback tracker record created/updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating/updating feedback tracker:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create/update feedback tracker record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/v1/feedback/tracker - Update existing tracker record
export async function PUT(request: NextRequest) {
  try {
    // Authenticate the request with write permission
    const authResult = await authenticateRequest(request, ['write']);
    if (!authResult) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    const { userId, chatOrigin, ...updateFields } = body;

    // Validate required identification fields
    if (!userId || !chatOrigin) {
      return NextResponse.json(
        { success: false, error: 'userId and chatOrigin are required to identify the record.' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updatePairs: string[] = [];
    const params: any[] = [userId, chatOrigin];
    let paramCount = 2;

    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined && value !== null) {
        paramCount++;
        const dbFieldName = key.replace(/([A-Z])/g, '_$1').toLowerCase(); // Convert camelCase to snake_case
        updatePairs.push(`${dbFieldName} = $${paramCount}`);
        params.push(value);
      }
    }

    if (updatePairs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields provided for update.' },
        { status: 400 }
      );
    }

    updatePairs.push(`updated_at = NOW()`);

    const queryText = `
      UPDATE n8n_feedback_tracker 
      SET ${updatePairs.join(', ')}
      WHERE user_id = $1 AND chat_origin = $2
      RETURNING *
    `;

    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tracker record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback tracker record updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating feedback tracker:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update feedback tracker record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/feedback/tracker - Delete tracker record
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the request with delete permission
    const authResult = await authenticateRequest(request, ['delete']);
    if (!authResult) {
      return createForbiddenResponse('Delete permission required.');
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const chatOrigin = searchParams.get('chatOrigin');

    if (!userId || !chatOrigin) {
      return NextResponse.json(
        { success: false, error: 'userId and chatOrigin parameters are required.' },
        { status: 400 }
      );
    }

    const queryText = `
      DELETE FROM n8n_feedback_tracker 
      WHERE user_id = $1 AND chat_origin = $2
      RETURNING *
    `;

    const result = await query(queryText, [userId, chatOrigin]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tracker record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback tracker record deleted successfully',
      deletedRecord: result.rows[0]
    });

  } catch (error) {
    console.error('Error deleting feedback tracker:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete feedback tracker record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle CORS for all methods
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
}