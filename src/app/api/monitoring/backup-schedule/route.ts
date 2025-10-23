import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';
import {
  loadBackupSchedule,
  saveBackupSchedule,
  createScheduledBackup,
  cleanupOldBackups,
  loadBackupMetadata,
  getBackupStatistics,
  BackupScheduleConfig
} from '@/utils/backupScheduler';

// GET - Get backup schedule configuration and statistics
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Get backup schedule API called');
    
    // Check authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      console.log('⚠️ Authentication failed');
      return createUnauthorizedResponse('Access denied. Please login to view backup schedule.');
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'statistics') {
      // Get backup statistics
      const stats = await getBackupStatistics();
      const schedule = await loadBackupSchedule();
      
      return NextResponse.json({
        success: true,
        data: {
          statistics: stats,
          schedule: schedule
        }
      });
    } else {
      // Get schedule configuration
      const schedule = await loadBackupSchedule();
      const metadata = await loadBackupMetadata();
      
      return NextResponse.json({
        success: true,
        data: {
          schedule,
          recentBackups: metadata
            .sort((a, b) => b.created.getTime() - a.created.getTime())
            .slice(0, 10) // Last 10 backups
        }
      });
    }

  } catch (error) {
    console.error('Get backup schedule API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get backup schedule',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST - Update backup schedule or trigger manual backup
export async function POST(request: NextRequest) {
  try {
    console.log('⚙️ Update backup schedule API called');
    
    // Check authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      console.log('⚠️ Authentication failed');
      return createUnauthorizedResponse('Access denied. Please login to manage backup schedule.');
    }

    const requestData = await request.json();
    const { action, schedule, backupType } = requestData;

    if (action === 'update-schedule') {
      // Update backup schedule configuration
      const config = schedule as BackupScheduleConfig;
      
      // Validate configuration
      if (config.hour < 0 || config.hour > 23) {
        throw new Error('Hour must be between 0 and 23');
      }
      if (config.minute < 0 || config.minute > 59) {
        throw new Error('Minute must be between 0 and 59');
      }
      if (config.frequency === 'weekly' && (config.dayOfWeek !== undefined && (config.dayOfWeek < 0 || config.dayOfWeek > 6))) {
        throw new Error('Day of week must be between 0 (Sunday) and 6 (Saturday)');
      }
      
      await saveBackupSchedule(config);
      
      return NextResponse.json({
        success: true,
        message: 'Backup schedule updated successfully',
        data: { schedule: config }
      });
      
    } else if (action === 'create-backup') {
      // Create a manual scheduled backup
      const type = backupType as 'weekly' | 'monthly' || 'weekly';
      
      console.log(`🚀 Creating manual ${type} backup...`);
      
      const result = await createScheduledBackup(type);
      
      if (!result.success) {
        throw new Error(result.error || 'Backup creation failed');
      }
      
      return NextResponse.json({
        success: true,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} backup created successfully`,
        data: {
          fileName: result.fileName,
          fileSize: result.fileSize,
          filePath: result.filePath,
          duration: result.duration
        }
      });
      
    } else if (action === 'cleanup-backups') {
      // Manual cleanup of old backups
      const metadata = await loadBackupMetadata();
      const schedule = await loadBackupSchedule();
      
      await cleanupOldBackups(metadata, schedule.retention);
      
      const stats = await getBackupStatistics();
      
      return NextResponse.json({
        success: true,
        message: 'Backup cleanup completed successfully',
        data: { statistics: stats }
      });
      
    } else {
      throw new Error('Invalid action specified');
    }

  } catch (error) {
    console.error('Update backup schedule API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update backup schedule',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific backup
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Delete backup API called');
    
    // Check authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      console.log('⚠️ Authentication failed');
      return createUnauthorizedResponse('Access denied. Please login to delete backups.');
    }

    const url = new URL(request.url);
    const fileName = url.searchParams.get('fileName');
    
    if (!fileName) {
      throw new Error('File name is required');
    }
    
    // Load metadata and find backup
    const metadata = await loadBackupMetadata();
    const backupIndex = metadata.findIndex(b => b.fileName === fileName);
    
    if (backupIndex === -1) {
      throw new Error('Backup not found');
    }
    
    const backup = metadata[backupIndex];
    
    // Delete file
    const { promises: fs } = require('fs');
    try {
      await fs.unlink(backup.filePath);
      console.log(`🗑️ Deleted backup file: ${fileName}`);
    } catch (error) {
      console.warn(`⚠️ Could not delete backup file ${fileName}:`, error);
    }
    
    // Remove from metadata
    metadata.splice(backupIndex, 1);
    
    // Save updated metadata
    const { saveBackupMetadata } = require('@/utils/backupScheduler');
    await saveBackupMetadata(metadata);
    
    return NextResponse.json({
      success: true,
      message: `Backup ${fileName} deleted successfully`
    });

  } catch (error) {
    console.error('Delete backup API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete backup',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}