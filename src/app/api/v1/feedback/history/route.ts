import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/utils/auth';
import { query } from '@/utils/database';

// Interface for feedback history item
interface FeedbackHistory {
  id: number;
  userId: string;
  feedbackRating: number;
  feedbackReason: string | null;
  xid: string | null;
  channelId: string | null;
  accountId: string | null;
  chatOrigin: string;
  chatName: string | null;
  companyCode: string | null;
  employeeNumber: string | null;
  feedbackDate: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for API response
interface FeedbackHistoryResponse {
  success: boolean;
  data: FeedbackHistory[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters?: {
    userId?: string;
    chatOrigin?: string;
    rating?: number;
    companyCode?: string;
    startDate?: string;
    endDate?: string;
  };
  summary?: {
    totalFeedback: number;
    averageRating: number;
    ratingDistribution: {
      rating1: number;
      rating2: number;
      rating3: number;
      rating4: number;
      rating5: number;
    };
  };
}

// GET /api/v1/feedback/history - Get feedback history records
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
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined;
    const companyCode = searchParams.get('companyCode');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'feedback_date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const includeSummary = searchParams.get('includeSummary') === 'true';

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

    // Validate rating parameter
    if (rating !== undefined && (isNaN(rating) || rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: 'Invalid rating parameter. Must be between 1 and 5.' },
        { status: 400 }
      );
    }

    // Validate sort parameters
    const validSortFields = ['id', 'user_id', 'feedback_rating', 'feedback_date', 'created_at', 'chat_origin', 'company_code'];
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
        id,
        user_id,
        feedback_rating,
        feedback_reason,
        xid,
        channel_id,
        account_id,
        chat_origin,
        chat_name,
        company_code,
        employee_number,
        feedback_date,
        created_at,
        updated_at
      FROM n8n_feedback_history
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

    if (rating !== undefined) {
      paramCount++;
      queryText += ` AND feedback_rating = $${paramCount}`;
      params.push(rating);
    }

    if (companyCode) {
      paramCount++;
      queryText += ` AND company_code = $${paramCount}`;
      params.push(companyCode);
    }

    if (startDate) {
      paramCount++;
      queryText += ` AND feedback_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      queryText += ` AND feedback_date <= $${paramCount}`;
      params.push(endDate);
    }

    // Add sorting and pagination
    queryText += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM n8n_feedback_history WHERE 1=1`;
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

    if (rating !== undefined) {
      countParamCount++;
      countQuery += ` AND feedback_rating = $${countParamCount}`;
      countParams.push(rating);
    }

    if (companyCode) {
      countParamCount++;
      countQuery += ` AND company_code = $${countParamCount}`;
      countParams.push(companyCode);
    }

    if (startDate) {
      countParamCount++;
      countQuery += ` AND feedback_date >= $${countParamCount}`;
      countParams.push(startDate);
    }

    if (endDate) {
      countParamCount++;
      countQuery += ` AND feedback_date <= $${countParamCount}`;
      countParams.push(endDate);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Format the data
    const historyData: FeedbackHistory[] = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      feedbackRating: row.feedback_rating,
      feedbackReason: row.feedback_reason,
      xid: row.xid,
      channelId: row.channel_id,
      accountId: row.account_id,
      chatOrigin: row.chat_origin,
      chatName: row.chat_name,
      companyCode: row.company_code,
      employeeNumber: row.employee_number,
      feedbackDate: row.feedback_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    // Build response
    const response: FeedbackHistoryResponse = {
      success: true,
      data: historyData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        userId: userId || undefined,
        chatOrigin: chatOrigin || undefined,
        rating: rating || undefined,
        companyCode: companyCode || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }
    };

    // Add summary if requested
    if (includeSummary) {
      // Calculate summary statistics with same filters
      let summaryQuery = `
        SELECT
          COUNT(*) as total_feedback,
          ROUND(AVG(feedback_rating)::numeric, 2) as average_rating,
          COUNT(CASE WHEN feedback_rating = 1 THEN 1 END) as rating_1,
          COUNT(CASE WHEN feedback_rating = 2 THEN 1 END) as rating_2,
          COUNT(CASE WHEN feedback_rating = 3 THEN 1 END) as rating_3,
          COUNT(CASE WHEN feedback_rating = 4 THEN 1 END) as rating_4,
          COUNT(CASE WHEN feedback_rating = 5 THEN 1 END) as rating_5
        FROM n8n_feedback_history
        WHERE 1=1
      `;

      // Apply same filters to summary query
      const summaryParams: any[] = [];
      let summaryParamCount = 0;

      if (userId) {
        summaryParamCount++;
        summaryQuery += ` AND user_id = $${summaryParamCount}`;
        summaryParams.push(userId);
      }

      if (chatOrigin) {
        summaryParamCount++;
        summaryQuery += ` AND chat_origin = $${summaryParamCount}`;
        summaryParams.push(chatOrigin);
      }

      if (rating !== undefined) {
        summaryParamCount++;
        summaryQuery += ` AND feedback_rating = $${summaryParamCount}`;
        summaryParams.push(rating);
      }

      if (companyCode) {
        summaryParamCount++;
        summaryQuery += ` AND company_code = $${summaryParamCount}`;
        summaryParams.push(companyCode);
      }

      if (startDate) {
        summaryParamCount++;
        summaryQuery += ` AND feedback_date >= $${summaryParamCount}`;
        summaryParams.push(startDate);
      }

      if (endDate) {
        summaryParamCount++;
        summaryQuery += ` AND feedback_date <= $${summaryParamCount}`;
        summaryParams.push(endDate);
      }

      const summaryResult = await query(summaryQuery, summaryParams);
      const summaryRow = summaryResult.rows[0];

      response.summary = {
        totalFeedback: parseInt(summaryRow?.total_feedback || '0'),
        averageRating: parseFloat(summaryRow?.average_rating || '0'),
        ratingDistribution: {
          rating1: parseInt(summaryRow?.rating_1 || '0'),
          rating2: parseInt(summaryRow?.rating_2 || '0'),
          rating3: parseInt(summaryRow?.rating_3 || '0'),
          rating4: parseInt(summaryRow?.rating_4 || '0'),
          rating5: parseInt(summaryRow?.rating_5 || '0'),
        },
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in feedback history API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch feedback history data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/feedback/history - Create new feedback history record
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
      feedbackRating,
      feedbackReason,
      xid,
      channelId,
      accountId,
      chatOrigin,
      chatName,
      companyCode,
      employeeNumber,
      feedbackDate
    } = body;

    // Validate required fields
    if (!userId || !feedbackRating || !chatOrigin) {
      return NextResponse.json(
        { success: false, error: 'userId, feedbackRating, and chatOrigin are required fields.' },
        { status: 400 }
      );
    }

    // Validate rating value
    if (feedbackRating < 1 || feedbackRating > 5) {
      return NextResponse.json(
        { success: false, error: 'feedbackRating must be between 1 and 5.' },
        { status: 400 }
      );
    }

    // Insert new feedback history record
    const queryText = `
      INSERT INTO n8n_feedback_history (
        user_id, feedback_rating, feedback_reason, xid, channel_id, 
        account_id, chat_origin, chat_name, company_code, employee_number, 
        feedback_date, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
        COALESCE($11, CURRENT_DATE), NOW(), NOW()
      )
      RETURNING *
    `;

    const params = [
      userId,
      feedbackRating,
      feedbackReason,
      xid,
      channelId,
      accountId,
      chatOrigin,
      chatName,
      companyCode,
      employeeNumber,
      feedbackDate
    ];

    const result = await query(queryText, params);

    return NextResponse.json({
      success: true,
      message: 'Feedback history record created successfully',
      data: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating feedback history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create feedback history record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/v1/feedback/history - Update existing history record
export async function PUT(request: NextRequest) {
  try {
    // Authenticate the request with write permission
    const authResult = await authenticateRequest(request, ['write']);
    if (!authResult) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    const { id, ...updateFields } = body;

    // Validate required identification field
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required to identify the record.' },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (updateFields.feedbackRating && (updateFields.feedbackRating < 1 || updateFields.feedbackRating > 5)) {
      return NextResponse.json(
        { success: false, error: 'feedbackRating must be between 1 and 5.' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updatePairs: string[] = [];
    const params: any[] = [id];
    let paramCount = 1;

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
      UPDATE n8n_feedback_history 
      SET ${updatePairs.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'History record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback history record updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating feedback history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update feedback history record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/feedback/history - Delete history record
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the request with delete permission
    const authResult = await authenticateRequest(request, ['delete']);
    if (!authResult) {
      return createForbiddenResponse('Delete permission required.');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id parameter is required.' },
        { status: 400 }
      );
    }

    const queryText = `
      DELETE FROM n8n_feedback_history 
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(queryText, [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'History record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback history record deleted successfully',
      deletedRecord: result.rows[0]
    });

  } catch (error) {
    console.error('Error deleting feedback history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete feedback history record',
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