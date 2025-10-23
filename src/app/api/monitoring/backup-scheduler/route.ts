import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';
import { 
  startBackupScheduler, 
  stopBackupScheduler, 
  getSchedulerStatus, 
  triggerBackupCheck 
} from '@/utils/backupCron';

// GET - Get scheduler status
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Get backup scheduler status API called');
    
    // Check authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      console.log('⚠️ Authentication failed');
      return createUnauthorizedResponse('Access denied. Please login to view scheduler status.');
    }

    const status = getSchedulerStatus();

    return NextResponse.json({
      success: true,
      data: {
        scheduler: status,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get scheduler status API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get scheduler status',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST - Control scheduler (start/stop/trigger)
export async function POST(request: NextRequest) {
  try {
    console.log('🎛️ Control backup scheduler API called');
    
    // Check authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      console.log('⚠️ Authentication failed');
      return createUnauthorizedResponse('Access denied. Please login to control scheduler.');
    }

    const requestData = await request.json();
    const { action } = requestData;

    let result: any = {};

    switch (action) {
      case 'start':
        startBackupScheduler();
        result = { message: 'Backup scheduler started successfully' };
        break;

      case 'stop':
        stopBackupScheduler();
        result = { message: 'Backup scheduler stopped successfully' };
        break;

      case 'status':
        result = { status: getSchedulerStatus() };
        break;

      case 'trigger':
        console.log('🚀 Manual backup trigger requested');
        const backupCreated = await triggerBackupCheck();
        result = { 
          message: backupCreated 
            ? 'Manual backup completed successfully' 
            : 'No backup was needed at this time',
          backupCreated 
        };
        break;

      default:
        throw new Error('Invalid action. Use: start, stop, status, or trigger');
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        scheduler: getSchedulerStatus(),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Control scheduler API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to control scheduler',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}