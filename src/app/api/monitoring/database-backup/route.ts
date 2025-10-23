import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';
import { primaryPool, n8nPool } from '@/utils/database';
import { 
  generateDatabaseBackup, 
  createCombinedBackup,
  createZipBackup,
  saveBackupToFile,
  BackupOptions,
  BackupResult
} from '@/utils/databaseBackup';
import { promises as fs } from 'fs';
import path from 'path';

// Interface for backup request
interface BackupRequest {
  databases?: ('primary' | 'n8n' | 'both')[];
  includeData?: boolean;
  schemaOnly?: boolean;
  format?: 'sql' | 'zip'; // Support both SQL and ZIP formats
  tablesToInclude?: string[];
  tablesToExclude?: string[];
}

// Interface for backup response
interface BackupResponse {
  success: boolean;
  data?: {
    fileName: string;
    fileSize: number;
    filePath: string;
    downloadUrl: string;
    databases: string[];
    duration: number;
    tablesBackedUp?: number;
  };
  error?: string;
}

// POST - Create database backup
export async function POST(request: NextRequest) {
  try {
    console.log('🗄️ Database backup API called');
    
    // Add a processing timeout - increased for large table support
    const startTime = Date.now();
    const PROCESSING_TIMEOUT = 600000; // 10 minutes for large tables backup
    
    // Check authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      console.log('⚠️ Authentication failed');
      return createUnauthorizedResponse('Access denied. Please login to create database backups.');
    }

    // Parse request body
    const backupRequest: BackupRequest = await request.json();
    const {
      databases = ['both'],
      includeData = true,
      schemaOnly = false,
      format = 'zip', // Default to ZIP format
      tablesToInclude = [],
      tablesToExclude = []
    } = backupRequest;

    console.log('Backup request:', {
      databases,
      includeData,
      schemaOnly,
      format,
      tablesToInclude: tablesToInclude.length,
      tablesToExclude: tablesToExclude.length
    });

    // Prepare backup options with timeout protection
    const backupOptions: BackupOptions = {
      includeData,
      schemaOnly,
      tablesToInclude: tablesToInclude.length > 0 ? tablesToInclude : undefined,
      tablesToExclude: tablesToExclude.length > 0 ? tablesToExclude : undefined
    };

    const backupFiles: { name: string; filePath: string }[] = [];
    const backedUpDatabases: string[] = [];
    let totalTablesBackedUp = 0;

    // Ensure backup directory exists
    const backupDir = path.join(process.cwd(), 'public', 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    // Backup Primary Database
    if (databases.includes('primary') || databases.includes('both')) {
      try {
        console.log('📦 Starting primary database backup...');
        
        // Check timeout before starting
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > PROCESSING_TIMEOUT) {
          throw new Error('Processing timeout - unable to complete backup within time limit');
        }
        
        const tempFileName = `temp_postgres_backup_${Date.now()}.sql`;
        const tempFilePath = path.join(backupDir, tempFileName);
        
        await generateDatabaseBackup(primaryPool, 'postgres', tempFilePath, backupOptions);
        
        // Count tables from file (rough estimate)
        const fileContent = await fs.readFile(tempFilePath, 'utf8');
        const tableCount = (fileContent.match(/-- Table:/g) || []).length;
        totalTablesBackedUp += tableCount;
        
        backupFiles.push({
          name: `postgres_backup_${new Date().toISOString().slice(0, 10)}.sql`,
          filePath: tempFilePath
        });
        backedUpDatabases.push('postgres');
        
        console.log(`✅ Primary database backup completed (${tableCount} tables)`);
      } catch (error) {
        console.error('❌ Error backing up primary database:', error);
        // Continue with other databases if one fails
        if (error instanceof Error && error.message.includes('timeout')) {
          throw error; // Re-throw timeout errors
        }
        console.warn('Continuing with other databases...');
      }
    }

    // Backup N8N Database
    if (databases.includes('n8n') || databases.includes('both')) {
      try {
        console.log('📦 Starting N8N database backup...');
        
        // Check timeout before starting
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > PROCESSING_TIMEOUT) {
          throw new Error('Processing timeout - unable to complete N8N backup within time limit');
        }
        
        const tempFileName = `temp_n8ndb_backup_${Date.now()}.sql`;
        const tempFilePath = path.join(backupDir, tempFileName);
        
        await generateDatabaseBackup(n8nPool, 'n8ndb', tempFilePath, backupOptions);
        
        // Count tables from file (rough estimate)
        const fileContent = await fs.readFile(tempFilePath, 'utf8');
        const tableCount = (fileContent.match(/-- Table:/g) || []).length;
        totalTablesBackedUp += tableCount;
        
        backupFiles.push({
          name: `n8ndb_backup_${new Date().toISOString().slice(0, 10)}.sql`,
          filePath: tempFilePath
        });
        backedUpDatabases.push('n8ndb');
        
        console.log(`✅ N8N database backup completed (${tableCount} tables)`);
      } catch (error) {
        console.error('❌ Error backing up N8N database:', error);
        // Continue if this is not a timeout error
        if (error instanceof Error && error.message.includes('timeout')) {
          throw error; // Re-throw timeout errors
        }
        console.warn('Continuing with backup creation...');
      }
    }

    if (backupFiles.length === 0) {
      throw new Error('No databases selected for backup');
    }

    // Create backup file with appropriate extension
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileExtension = format === 'zip' ? 'zip' : 'sql';
    const fileName = `database_backup_${timestamp}.${fileExtension}`;

    let backupResult: BackupResult;

    // Create backup file in the requested format
    if (format === 'zip') {
      // Create ZIP archive containing SQL files
      backupResult = await createZipBackup(backupFiles, fileName, './public/backups');
    } else {
      // Create SQL file (legacy format)
      if (backupFiles.length > 1) {
        // Create combined file with multiple database backups
        backupResult = await createCombinedBackup(backupFiles, fileName, './public/backups');
      } else if (backupFiles.length === 1) {
        // Single database - just rename the temporary file
        const tempFile = backupFiles[0];
        const finalPath = path.join('./public/backups', fileName);
        
        await fs.rename(tempFile.filePath, finalPath);
        
        const stats = await fs.stat(finalPath);
        backupResult = {
          success: true,
          filePath: finalPath,
          fileName: fileName,
          fileSize: stats.size,
          duration: Date.now() - startTime
        };
      } else {
        throw new Error('No databases were successfully backed up');
      }
    }

    if (!backupResult.success) {
      throw new Error(backupResult.error || 'Failed to create backup file');
    }

    const duration = Date.now() - startTime;

    // Generate download URL
    const downloadUrl = `/backups/${backupResult.fileName}`;

    const response: BackupResponse = {
      success: true,
      data: {
        fileName: backupResult.fileName!,
        fileSize: backupResult.fileSize!,
        filePath: backupResult.filePath!,
        downloadUrl,
        databases: backedUpDatabases,
        duration,
        tablesBackedUp: totalTablesBackedUp
      }
    };

    console.log(`✅ Database backup completed successfully:`, response.data);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Database backup API Error:', error);
    
    // Return structured error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create database backup',
        details: 'Unable to generate database backup files',
        timestamp: new Date().toISOString()
      } as BackupResponse,
      { status: 500 }
    );
  }
}

// GET - List available backups
export async function GET(request: NextRequest) {
  try {
    console.log('📋 List database backups API called');
    
    // Check authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      console.log('⚠️ Authentication failed');
      return createUnauthorizedResponse('Access denied. Please login to view database backups.');
    }

    const backupDir = './public/backups';
    
    try {
      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true });
      
      // Get list of backup files (both SQL and ZIP)
      const files = await fs.readdir(backupDir);
      const backupFiles = files.filter(file => 
        file.endsWith('.sql') || file.endsWith('.zip')
      );

      // Get file details
      const fileDetails = await Promise.all(
        backupFiles.map(async (fileName) => {
          const filePath = path.join(backupDir, fileName);
          const stats = await fs.stat(filePath);
          
          return {
            fileName,
            fileSize: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            downloadUrl: `/backups/${fileName}`
          };
        })
      );

      // Sort by creation date (newest first)
      fileDetails.sort((a, b) => b.created.getTime() - a.created.getTime());

      return NextResponse.json({
        success: true,
        data: {
          backups: fileDetails,
          totalFiles: fileDetails.length,
          backupDirectory: backupDir
        }
      });

    } catch (error) {
      console.error('Error listing backup files:', error);
      throw new Error('Failed to list backup files');
    }

  } catch (error) {
    console.error('List backups API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list database backups',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}