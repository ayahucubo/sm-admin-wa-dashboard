import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';
import { query } from '@/utils/database';

// Interface for feedback detail item
interface FeedbackDetailItem {
  id: number;
  userId: string;
  chatName: string;
  feedbackRating: number;
  feedbackReason: string;
  feedbackDate: string;
  companyCode: string;
}

// Interface for daily rating stats
interface DailyRatingStats {
  date: string;
  ratings: {
    rating1: number;
    rating2: number;
    rating3: number;
    rating4: number;
    rating5: number;
  };
  totalFeedback: number;
  averageRating: number;
}

// Interface for the response
interface FeedbackRatingResponse {
  success: boolean;
  data: DailyRatingStats[];
  summary: {
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
  period: {
    days: number;
    startDate: string | null;
    endDate: string | null;
  };
}

// Function to get feedback rating statistics aggregated by date
async function getFeedbackRatingStats(days: number = 30): Promise<{
  dailyStats: DailyRatingStats[];
  summary: FeedbackRatingResponse['summary'];
}> {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    
    // Format dates for PostgreSQL
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`Fetching feedback rating stats from ${startDateStr} to ${endDateStr}`);

    // Query to get rating distribution per day from n8n_feedback_history table
    // Using feedback_rating column and feedback_date for date filtering
    const queryText = `
      WITH date_series AS (
        SELECT generate_series(
          $1::date,
          $2::date,
          '1 day'::interval
        )::date as date
      ),
      daily_ratings AS (
        SELECT
          feedback_date as date,
          COUNT(CASE WHEN feedback_rating = 1 THEN 1 END) as rating_1,
          COUNT(CASE WHEN feedback_rating = 2 THEN 1 END) as rating_2,
          COUNT(CASE WHEN feedback_rating = 3 THEN 1 END) as rating_3,
          COUNT(CASE WHEN feedback_rating = 4 THEN 1 END) as rating_4,
          COUNT(CASE WHEN feedback_rating = 5 THEN 1 END) as rating_5,
          COUNT(*) as total_feedback,
          ROUND(AVG(feedback_rating)::numeric, 2) as average_rating
        FROM n8n_feedback_history
        WHERE feedback_date >= $1
          AND feedback_date <= $2
          AND feedback_rating IS NOT NULL
          AND feedback_rating BETWEEN 1 AND 5
        GROUP BY feedback_date
      )
      SELECT
        ds.date::text as date,
        COALESCE(dr.rating_1, 0) as rating_1,
        COALESCE(dr.rating_2, 0) as rating_2,
        COALESCE(dr.rating_3, 0) as rating_3,
        COALESCE(dr.rating_4, 0) as rating_4,
        COALESCE(dr.rating_5, 0) as rating_5,
        COALESCE(dr.total_feedback, 0) as total_feedback,
        COALESCE(dr.average_rating, 0) as average_rating
      FROM date_series ds
      LEFT JOIN daily_ratings dr ON ds.date = dr.date
      ORDER BY ds.date ASC
    `;

    const result = await query(queryText, [startDateStr, endDateStr]);

    // Process daily stats
    const dailyStats: DailyRatingStats[] = result.rows.map(row => ({
      date: row.date,
      ratings: {
        rating1: parseInt(row.rating_1),
        rating2: parseInt(row.rating_2),
        rating3: parseInt(row.rating_3),
        rating4: parseInt(row.rating_4),
        rating5: parseInt(row.rating_5),
      },
      totalFeedback: parseInt(row.total_feedback),
      averageRating: parseFloat(row.average_rating) || 0,
    }));

    // Calculate summary statistics
    const summaryQuery = `
      SELECT
        COUNT(*) as total_feedback,
        ROUND(AVG(feedback_rating)::numeric, 2) as average_rating,
        COUNT(CASE WHEN feedback_rating = 1 THEN 1 END) as rating_1,
        COUNT(CASE WHEN feedback_rating = 2 THEN 1 END) as rating_2,
        COUNT(CASE WHEN feedback_rating = 3 THEN 1 END) as rating_3,
        COUNT(CASE WHEN feedback_rating = 4 THEN 1 END) as rating_4,
        COUNT(CASE WHEN feedback_rating = 5 THEN 1 END) as rating_5
      FROM n8n_feedback_history
      WHERE feedback_date >= $1
        AND feedback_date <= $2
        AND feedback_rating IS NOT NULL
        AND feedback_rating BETWEEN 1 AND 5
    `;

    const summaryResult = await query(summaryQuery, [startDateStr, endDateStr]);
    const summaryRow = summaryResult.rows[0];

    const summary = {
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

    return { dailyStats, summary };

  } catch (error) {
    console.error('Error fetching feedback rating statistics:', error);
    throw error;
  }
}

// Function to get feedback details with filtering and pagination
async function getFeedbackDetails(
  startDate: string,
  endDate: string,
  rating?: number,
  page: number = 1,
  limit: number = 20
): Promise<{ details: FeedbackDetailItem[]; total: number }> {
  try {
    console.log(`Fetching feedback details from ${startDate} to ${endDate}, rating: ${rating || 'all'}, page: ${page}`);

    const offset = (page - 1) * limit;
    
    // Build query with optional rating filter
    let queryText = `
      SELECT 
        id,
        user_id,
        chat_name,
        feedback_rating,
        feedback_reason,
        feedback_date::text,
        company_code
      FROM n8n_feedback_history
      WHERE feedback_date >= $1
        AND feedback_date <= $2
        AND feedback_rating IS NOT NULL
        AND feedback_rating BETWEEN 1 AND 5
    `;
    
    const params: (string | number)[] = [startDate, endDate];
    
    if (rating && rating >= 1 && rating <= 5) {
      queryText += ` AND feedback_rating = $3`;
      params.push(rating);
    }
    
    queryText += ` ORDER BY feedback_date DESC, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM n8n_feedback_history
      WHERE feedback_date >= $1
        AND feedback_date <= $2
        AND feedback_rating IS NOT NULL
        AND feedback_rating BETWEEN 1 AND 5
    `;
    
    const countParams: (string | number)[] = [startDate, endDate];
    
    if (rating && rating >= 1 && rating <= 5) {
      countQuery += ` AND feedback_rating = $3`;
      countParams.push(rating);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || '0');

    const details: FeedbackDetailItem[] = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id || '',
      chatName: row.chat_name || 'Unknown',
      feedbackRating: parseInt(row.feedback_rating),
      feedbackReason: row.feedback_reason || '',
      feedbackDate: row.feedback_date,
      companyCode: row.company_code || '',
    }));

    return { details, total };

  } catch (error) {
    console.error('Error fetching feedback details:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request - supports both admin tokens and API keys
    const authPayload = await authenticateAdmin(request);
    if (!authPayload) {
      return createUnauthorizedResponse();
    }

    console.log(`Feedback Rating API accessed by: ${authPayload.email}`);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const type = searchParams.get('type') || 'chart'; // 'chart' or 'details'
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const filterStartDate = searchParams.get('startDate');
    const filterEndDate = searchParams.get('endDate');

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { success: false, error: 'Invalid days parameter. Must be between 1 and 365.' },
        { status: 400 }
      );
    }

    // Calculate date range
    const endDate = filterEndDate ? new Date(filterEndDate) : new Date();
    const startDate = filterStartDate ? new Date(filterStartDate) : new Date();
    if (!filterStartDate) {
      startDate.setDate(endDate.getDate() - days + 1);
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Return details if requested
    if (type === 'details') {
      const { details, total } = await getFeedbackDetails(startDateStr, endDateStr, rating, page, limit);
      
      return NextResponse.json({
        success: true,
        data: details,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          startDate: startDateStr,
          endDate: endDateStr,
          rating: rating || null,
        },
      });
    }

    // Default: return chart data
    const { dailyStats, summary } = await getFeedbackRatingStats(days);

    const response: FeedbackRatingResponse = {
      success: true,
      data: dailyStats,
      summary,
      period: {
        days,
        startDate: startDateStr,
        endDate: endDateStr,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in feedback rating API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch feedback rating data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
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
