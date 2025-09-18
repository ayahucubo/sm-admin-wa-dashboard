import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';
import { checkDatabaseConnection } from '@/utils/database';

export async function GET(request: NextRequest) {
  const authPayload = await authenticateAdmin(request);
  if (!authPayload) {
    return createUnauthorizedResponse();
  }

  try {
    console.log('=== DEBUG API ENDPOINT ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));

    // Environment variables check
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      DB_POSTGRESDB_HOST: process.env.DB_POSTGRESDB_HOST ? '[SET]' : '[NOT SET]',
      DB_POSTGRESDB_PORT: process.env.DB_POSTGRESDB_PORT,
      DB_POSTGRESDB_DATABASE: process.env.DB_POSTGRESDB_DATABASE,
      DB_POSTGRESDB_USER: process.env.DB_POSTGRESDB_USER ? '[SET]' : '[NOT SET]',
      DB_POSTGRESDB_PASSWORD: process.env.DB_POSTGRESDB_PASSWORD ? '[SET]' : '[NOT SET]',
      DB_HOST: process.env.DB_HOST ? '[SET]' : '[NOT SET]',
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER ? '[SET]' : '[NOT SET]',
      DB_PASSWORD: process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]',
    };

    console.log('Environment Variables:', envVars);

    // Test database connection
    const dbResult = await checkDatabaseConnection();
    console.log('Database Connection Result:', dbResult);

    // Return debug information
    return NextResponse.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        environmentVariables: envVars,
        databaseConnection: dbResult,
        serverInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        apiEndpoint: '/api/debug',
        message: 'Debug endpoint is working correctly'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (error) {
    console.error('DEBUG API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      },
      debug: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        apiEndpoint: '/api/debug',
      }
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }
}