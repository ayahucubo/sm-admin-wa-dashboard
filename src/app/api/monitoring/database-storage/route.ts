import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';
import { getAllDatabaseStorageInfo } from '@/utils/database';

// GET - Fetch database storage information for both postgres and n8ndb
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Database storage API called');
    
    // Check authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      console.log('⚠️ Authentication failed');
      return createUnauthorizedResponse('Access denied. Please login to view database storage information.');
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeTableDetails = searchParams.get('includeTableDetails') !== 'false'; // Default true
    const limitTables = parseInt(searchParams.get('limitTables') || '10'); // Default to top 10 tables

    console.log('Fetching database storage information...');
    const startTime = Date.now();

    // Get storage information for both databases
    const storageInfo = await getAllDatabaseStorageInfo();

    const responseTime = Date.now() - startTime;
    console.log(`✅ Database storage info retrieved in ${responseTime}ms`);

    if (!storageInfo.success) {
      return NextResponse.json(
        {
          success: false,
          error: (storageInfo as any).error || 'Failed to retrieve database storage information',
          details: 'Failed to retrieve database storage information',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Prepare response data
    const response = {
      success: true,
      data: {
        summary: storageInfo.summary,
        primaryDatabase: {
          ...storageInfo.primaryDatabase,
          tables: includeTableDetails 
            ? storageInfo.primaryDatabase!.tables.slice(0, limitTables)
            : []
        },
        n8nDatabase: {
          ...storageInfo.n8nDatabase,
          tables: includeTableDetails 
            ? storageInfo.n8nDatabase!.tables.slice(0, limitTables)
            : []
        }
      },
      metadata: {
        retrievedAt: storageInfo.summary.retrievedAt,
        responseTimeMs: responseTime,
        includeTableDetails,
        limitTables: includeTableDetails ? limitTables : 0
      }
    };

    // Log summary for monitoring
    console.log('📈 Database Storage Summary:', {
      totalDatabases: storageInfo.summary.totalDatabases,
      combinedSize: storageInfo.summary.combinedSizePretty,
      totalTables: storageInfo.summary.totalTables,
      primaryDbSize: storageInfo.primaryDatabase?.databaseInfo.totalSize,
      n8nDbSize: storageInfo.n8nDatabase?.databaseInfo.totalSize
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Database storage API Error:', error);
    
    // Return structured error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch database storage information',
        details: 'Unable to retrieve database storage statistics',
        timestamp: new Date().toISOString(),
        data: {
          summary: {
            totalDatabases: 0,
            combinedSize: 0,
            combinedSizePretty: '0 B',
            totalTables: 0,
            retrievedAt: new Date().toISOString()
          },
          primaryDatabase: null,
          n8nDatabase: null
        }
      },
      { status: 500 }
    );
  }
}