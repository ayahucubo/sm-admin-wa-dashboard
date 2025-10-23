import { promises as fs } from 'fs';
import path from 'path';
import { createZipBackup, generateDatabaseBackup, BackupResult } from './databaseBackup';
import { primaryPool, n8nPool } from './database';

// Backup schedule configuration
export interface BackupScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6, Sunday = 0
  hour: number; // 0-23
  minute: number; // 0-59
  databases: ('primary' | 'n8n' | 'both')[];
  retention: {
    keepWeekly: number; // Number of weekly backups to keep
    keepMonthly: number; // Number of monthly backups to keep
  };
}

// Backup metadata for tracking
export interface BackupMetadata {
  fileName: string;
  filePath: string;
  created: Date;
  databases: string[];
  type: 'manual' | 'weekly' | 'monthly';
  size: number;
  week: string; // Format: YYYY-WW
  month: string; // Format: YYYY-MM
}

// Default backup schedule configuration
const DEFAULT_SCHEDULE: BackupScheduleConfig = {
  enabled: true,
  frequency: 'weekly',
  dayOfWeek: 0, // Sunday
  hour: 2, // 2 AM
  minute: 0,
  databases: ['both'],
  retention: {
    keepWeekly: 4, // Keep 4 weeks of backups
    keepMonthly: 3 // Keep 3 months of monthly backups
  }
};

// Get week number in format YYYY-WW
function getWeekString(date: Date): string {
  const year = date.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${year}-${weekNumber.toString().padStart(2, '0')}`;
}

// Get month string in format YYYY-MM
function getMonthString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

// Load backup schedule configuration
export async function loadBackupSchedule(): Promise<BackupScheduleConfig> {
  const configPath = path.join(process.cwd(), 'backup-schedule.json');
  
  try {
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData) as BackupScheduleConfig;
    
    // Merge with defaults to ensure all properties exist
    return { ...DEFAULT_SCHEDULE, ...config };
  } catch (error) {
    console.log('No backup schedule configuration found, using defaults');
    return DEFAULT_SCHEDULE;
  }
}

// Save backup schedule configuration
export async function saveBackupSchedule(config: BackupScheduleConfig): Promise<void> {
  const configPath = path.join(process.cwd(), 'backup-schedule.json');
  
  try {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log('Backup schedule configuration saved');
  } catch (error) {
    console.error('Error saving backup schedule configuration:', error);
    throw error;
  }
}

// Load backup metadata
export async function loadBackupMetadata(): Promise<BackupMetadata[]> {
  const metadataPath = path.join(process.cwd(), 'public', 'backups', 'backup-metadata.json');
  
  try {
    const metadataData = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataData) as BackupMetadata[];
    
    // Convert date strings back to Date objects
    return metadata.map(item => ({
      ...item,
      created: new Date(item.created)
    }));
  } catch (error) {
    console.log('No backup metadata found, starting fresh');
    return [];
  }
}

// Save backup metadata
export async function saveBackupMetadata(metadata: BackupMetadata[]): Promise<void> {
  const metadataPath = path.join(process.cwd(), 'public', 'backups', 'backup-metadata.json');
  const backupDir = path.dirname(metadataPath);
  
  // Ensure backup directory exists
  await fs.mkdir(backupDir, { recursive: true });
  
  try {
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    console.log(`Backup metadata saved for ${metadata.length} backups`);
  } catch (error) {
    console.error('Error saving backup metadata:', error);
    throw error;
  }
}

// Create a scheduled backup
export async function createScheduledBackup(
  type: 'weekly' | 'monthly' = 'weekly'
): Promise<BackupResult> {
  const config = await loadBackupSchedule();
  const startTime = Date.now();
  const now = new Date();
  
  console.log(`🕐 Creating ${type} scheduled backup...`);
  
  try {
    // Ensure backup directory exists
    const backupDir = path.join(process.cwd(), 'public', 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    // Create backup files for each database
    const backupFiles: { name: string; filePath: string }[] = [];
    const databases: string[] = [];
    
    // Backup databases based on configuration
    for (const dbType of config.databases) {
      if (dbType === 'both') {
        // Backup both databases
        await backupSingleDatabase('primary', backupFiles, databases, backupDir);
        await backupSingleDatabase('n8n', backupFiles, databases, backupDir);
      } else {
        await backupSingleDatabase(dbType, backupFiles, databases, backupDir);
      }
    }
    
    if (backupFiles.length === 0) {
      throw new Error('No databases were backed up');
    }
    
    // Create timestamp for filename
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const typePrefix = type === 'monthly' ? 'monthly' : 'weekly';
    const fileName = `${typePrefix}_backup_${timestamp}.zip`;
    
    // Create ZIP backup
    const backupResult = await createZipBackup(backupFiles, fileName, backupDir);
    
    if (!backupResult.success) {
      throw new Error(backupResult.error || 'Backup creation failed');
    }
    
    // Create backup metadata
    const metadata: BackupMetadata = {
      fileName: backupResult.fileName!,
      filePath: backupResult.filePath!,
      created: now,
      databases,
      type,
      size: backupResult.fileSize!,
      week: getWeekString(now),
      month: getMonthString(now)
    };
    
    // Load existing metadata and add new backup
    const existingMetadata = await loadBackupMetadata();
    existingMetadata.push(metadata);
    
    // Clean up old backups according to retention policy
    await cleanupOldBackups(existingMetadata, config.retention);
    
    console.log(`✅ Scheduled ${type} backup completed: ${fileName}`);
    
    return backupResult;
    
  } catch (error) {
    console.error(`❌ Scheduled ${type} backup failed:`, error);
    throw error;
  }
}

// Backup a single database
async function backupSingleDatabase(
  dbType: 'primary' | 'n8n',
  backupFiles: { name: string; filePath: string }[],
  databases: string[],
  backupDir: string
): Promise<void> {
  const pool = dbType === 'primary' ? primaryPool : n8nPool;
  const dbName = dbType === 'primary' ? 'postgres' : 'n8ndb';
  
  console.log(`📦 Backing up ${dbName} database...`);
  
  const tempFileName = `temp_${dbName}_${Date.now()}.sql`;
  const tempFilePath = path.join(backupDir, tempFileName);
  
  await generateDatabaseBackup(pool, dbName, tempFilePath, {
    includeData: true,
    schemaOnly: false
  });
  
  backupFiles.push({
    name: `${dbName}_backup_${new Date().toISOString().slice(0, 10)}.sql`,
    filePath: tempFilePath
  });
  
  databases.push(dbName);
}

// Clean up old backups according to retention policy
export async function cleanupOldBackups(
  metadata: BackupMetadata[],
  retention: BackupScheduleConfig['retention']
): Promise<void> {
  const now = new Date();
  const currentWeek = getWeekString(now);
  const currentMonth = getMonthString(now);
  
  console.log(`🧹 Cleaning up old backups (keep ${retention.keepWeekly} weeks, ${retention.keepMonthly} months)...`);
  
  // Separate backups by type
  const weeklyBackups = metadata.filter(b => b.type === 'weekly');
  const monthlyBackups = metadata.filter(b => b.type === 'monthly');
  const manualBackups = metadata.filter(b => b.type === 'manual');
  
  const backupsToDelete: BackupMetadata[] = [];
  const backupsToKeep: BackupMetadata[] = [...manualBackups]; // Always keep manual backups
  
  // Process weekly backups
  const weeklyByWeek = new Map<string, BackupMetadata[]>();
  weeklyBackups.forEach(backup => {
    const week = backup.week;
    if (!weeklyByWeek.has(week)) {
      weeklyByWeek.set(week, []);
    }
    weeklyByWeek.get(week)!.push(backup);
  });
  
  // Keep only the most recent backup per week, and only keep specified number of weeks
  const sortedWeeks = Array.from(weeklyByWeek.keys()).sort().reverse();
  const weeksToKeep = sortedWeeks.slice(0, retention.keepWeekly);
  
  for (const [week, backups] of weeklyByWeek) {
    if (weeksToKeep.includes(week)) {
      // Keep the most recent backup for this week
      const sorted = backups.sort((a, b) => b.created.getTime() - a.created.getTime());
      backupsToKeep.push(sorted[0]);
      backupsToDelete.push(...sorted.slice(1));
    } else {
      backupsToDelete.push(...backups);
    }
  }
  
  // Process monthly backups
  const monthlyByMonth = new Map<string, BackupMetadata[]>();
  monthlyBackups.forEach(backup => {
    const month = backup.month;
    if (!monthlyByMonth.has(month)) {
      monthlyByMonth.set(month, []);
    }
    monthlyByMonth.get(month)!.push(backup);
  });
  
  // Keep only the most recent backup per month, and only keep specified number of months
  const sortedMonths = Array.from(monthlyByMonth.keys()).sort().reverse();
  const monthsToKeep = sortedMonths.slice(0, retention.keepMonthly);
  
  for (const [month, backups] of monthlyByMonth) {
    if (monthsToKeep.includes(month)) {
      // Keep the most recent backup for this month
      const sorted = backups.sort((a, b) => b.created.getTime() - a.created.getTime());
      backupsToKeep.push(sorted[0]);
      backupsToDelete.push(...sorted.slice(1));
    } else {
      backupsToDelete.push(...backups);
    }
  }
  
  // Delete old backup files
  for (const backup of backupsToDelete) {
    try {
      await fs.unlink(backup.filePath);
      console.log(`🗑️ Deleted old backup: ${backup.fileName}`);
    } catch (error) {
      console.warn(`⚠️ Could not delete backup file ${backup.fileName}:`, error);
    }
  }
  
  // Save updated metadata
  await saveBackupMetadata(backupsToKeep);
  
  console.log(`✅ Cleanup completed: kept ${backupsToKeep.length} backups, deleted ${backupsToDelete.length} old backups`);
}

// Check if it's time for a scheduled backup
export async function checkScheduledBackup(): Promise<boolean> {
  const config = await loadBackupSchedule();
  
  if (!config.enabled) {
    return false;
  }
  
  const now = new Date();
  const metadata = await loadBackupMetadata();
  
  // Check for weekly backup
  if (config.frequency === 'weekly') {
    const currentWeek = getWeekString(now);
    const hasWeeklyBackup = metadata.some(b => 
      b.type === 'weekly' && b.week === currentWeek
    );
    
    if (!hasWeeklyBackup && now.getDay() === config.dayOfWeek && 
        now.getHours() === config.hour && now.getMinutes() >= config.minute && 
        now.getMinutes() < config.minute + 5) {
      return true;
    }
  }
  
  return false;
}

// Get backup statistics
export async function getBackupStatistics(): Promise<{
  totalBackups: number;
  weeklyBackups: number;
  monthlyBackups: number;
  manualBackups: number;
  totalSize: number;
  oldestBackup?: Date;
  newestBackup?: Date;
}> {
  const metadata = await loadBackupMetadata();
  
  const weeklyBackups = metadata.filter(b => b.type === 'weekly').length;
  const monthlyBackups = metadata.filter(b => b.type === 'monthly').length;
  const manualBackups = metadata.filter(b => b.type === 'manual').length;
  const totalSize = metadata.reduce((sum, b) => sum + b.size, 0);
  
  const dates = metadata.map(b => b.created).sort((a, b) => a.getTime() - b.getTime());
  
  return {
    totalBackups: metadata.length,
    weeklyBackups,
    monthlyBackups,
    manualBackups,
    totalSize,
    oldestBackup: dates[0],
    newestBackup: dates[dates.length - 1]
  };
}