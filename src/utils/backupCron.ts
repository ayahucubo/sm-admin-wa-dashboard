import { checkScheduledBackup, createScheduledBackup } from './backupScheduler';

// Global variable to track if scheduler is running
let schedulerRunning = false;
let schedulerInterval: NodeJS.Timeout | null = null;

// Start the backup scheduler (runs every 5 minutes)
export function startBackupScheduler() {
  if (schedulerRunning) {
    console.log('📅 Backup scheduler is already running');
    return;
  }

  console.log('🚀 Starting backup scheduler...');
  schedulerRunning = true;

  // Check for scheduled backups every 5 minutes
  schedulerInterval = setInterval(async () => {
    try {
      const shouldBackup = await checkScheduledBackup();
      
      if (shouldBackup) {
        console.log('⏰ Scheduled backup time detected, creating weekly backup...');
        
        try {
          const result = await createScheduledBackup('weekly');
          console.log('✅ Scheduled backup completed successfully:', result.fileName);
        } catch (error) {
          console.error('❌ Scheduled backup failed:', error);
        }
      }
    } catch (error) {
      console.error('⚠️ Error checking scheduled backup:', error);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  console.log('📅 Backup scheduler started (checking every 5 minutes)');
}

// Stop the backup scheduler
export function stopBackupScheduler() {
  if (!schedulerRunning) {
    console.log('📅 Backup scheduler is not running');
    return;
  }

  console.log('🛑 Stopping backup scheduler...');
  
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  
  schedulerRunning = false;
  console.log('📅 Backup scheduler stopped');
}

// Get scheduler status
export function getSchedulerStatus(): { running: boolean; nextCheck?: Date } {
  return {
    running: schedulerRunning,
    nextCheck: schedulerRunning ? new Date(Date.now() + 5 * 60 * 1000) : undefined
  };
}

// Manually trigger a backup check (for testing)
export async function triggerBackupCheck(): Promise<boolean> {
  console.log('🔍 Manually triggering backup check...');
  
  try {
    const shouldBackup = await checkScheduledBackup();
    
    if (shouldBackup) {
      console.log('⏰ Manual check: backup is due, creating weekly backup...');
      
      try {
        const result = await createScheduledBackup('weekly');
        console.log('✅ Manual backup completed successfully:', result.fileName);
        return true;
      } catch (error) {
        console.error('❌ Manual backup failed:', error);
        throw error;
      }
    } else {
      console.log('ℹ️ Manual check: no backup needed at this time');
      return false;
    }
  } catch (error) {
    console.error('⚠️ Error during manual backup check:', error);
    throw error;
  }
}

// Initialize scheduler when this module is imported (in production)
if (process.env.NODE_ENV === 'production') {
  // Add a delay to ensure database connections are established
  setTimeout(() => {
    startBackupScheduler();
  }, 10000); // Wait 10 seconds before starting
}