import { Pool } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import archiver from 'archiver';

// Database backup utility functions
export interface BackupOptions {
  includeData?: boolean;
  schemaOnly?: boolean;
  tablesToInclude?: string[];
  tablesToExclude?: string[];
}

export interface BackupResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  duration?: number;
  tablesBackedUp?: number;
}

// Get all table names from a database
export async function getAllTables(pool: Pool): Promise<string[]> {
  try {
    const query = `
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schemaname, tablename;
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => `${row.schemaname}.${row.tablename}`);
  } catch (error) {
    console.error('Error getting table list:', error);
    return [];
  }
}

// Generate SQL dump for a single table with optimized processing
export async function generateTableDump(
  pool: Pool, 
  tableName: string, 
  options: BackupOptions = {}
): Promise<string> {
  const { includeData = true, schemaOnly = false } = options;
  
  try {
    let sqlDump = '';
    
    // Get table schema
    const [schemaName, tableNameOnly] = tableName.includes('.') 
      ? tableName.split('.') 
      : ['public', tableName];
    
    // Get table structure
    const tableInfoQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position;
    `;
    
    const tableInfo = await pool.query(tableInfoQuery, [schemaName, tableNameOnly]);
    
    if (tableInfo.rows.length === 0) {
      return `-- Table ${tableName} not found\n`;
    }

    // Check table size first to avoid processing huge tables
    const tableSizeQuery = `
      SELECT 
        pg_size_pretty(pg_total_relation_size($1::text)) as size,
        pg_total_relation_size($1::text) as size_bytes,
        (SELECT count(*) FROM ${tableName}) as row_count
    `;
    
    let tableSize: any;
    try {
      tableSize = await pool.query(tableSizeQuery, [tableName]);
      const sizeBytes = parseInt(tableSize.rows[0]?.size_bytes || '0');
      const rowCount = parseInt(tableSize.rows[0]?.row_count || '0');
      
      // Handle very large tables with chunked processing
      const isLargeTable = sizeBytes > 100 * 1024 * 1024 || rowCount > 1000000;
      if (isLargeTable) {
        console.log(`📊 Processing large table ${tableName} (${tableSize.rows[0]?.size}, ${rowCount} rows) in chunks...`);
      }
    } catch (error) {
      console.warn(`Warning: Could not check size for table ${tableName}:`, error);
      // Continue with backup anyway
    }
    
    // Generate CREATE TABLE statement (simplified)
    sqlDump += `-- Table: ${tableName}\n`;
    sqlDump += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n\n`;
    
    // Use a simpler approach - get the actual CREATE TABLE statement
    try {
      const createTableQuery = `
        SELECT 
          'CREATE TABLE ' || $1 || ' (' || string_agg(
            column_name || ' ' || data_type ||
            CASE 
              WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
              WHEN numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL THEN '(' || numeric_precision || ',' || numeric_scale || ')'
              ELSE ''
            END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
            ', '
          ) || ');' as create_stmt
        FROM information_schema.columns 
        WHERE table_schema = $2 AND table_name = $3
        GROUP BY table_schema, table_name;
      `;
      
      const createResult = await pool.query(createTableQuery, [tableName, schemaName, tableNameOnly]);
      if (createResult.rows.length > 0) {
        sqlDump += createResult.rows[0].create_stmt + '\n\n';
      }
    } catch (error) {
      console.warn(`Warning: Could not generate CREATE TABLE for ${tableName}:`, error);
      sqlDump += `-- Could not generate CREATE TABLE statement for ${tableName}\n\n`;
    }
    
    // Insert data if requested and table is not too large
    if (includeData && !schemaOnly) {
      try {
        // Get row count first
        const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
        const countResult = await pool.query(countQuery);
        const totalRows = parseInt(countResult.rows[0]?.count || '0');
        
        if (totalRows > 0) {
          sqlDump += `-- Data for ${tableName} (${totalRows} rows)\n`;
          
          const columnNames = tableInfo.rows.map(col => col.column_name);
          
          // Dynamic batch size based on table size and complexity
          let batchSize = 100;
          if (totalRows > 100000) {
            batchSize = 50; // Very large tables - smaller batches
          } else if (totalRows > 10000) {
            batchSize = 100; // Large tables
          } else if (totalRows > 1000) {
            batchSize = 500; // Medium tables
          } else {
            batchSize = 1000; // Small tables
          }
          
          console.log(`📦 Backing up ${tableName}: ${totalRows} rows in batches of ${batchSize}...`);
          for (let i = 0; i < totalRows; i += batchSize) {
            // Progress logging for large tables
            if (totalRows > 10000 && i % (batchSize * 10) === 0) {
              const progress = ((i / totalRows) * 100).toFixed(1);
              console.log(`  📊 Progress: ${progress}% (${i}/${totalRows} rows)`);
            }
            
            const dataQuery = `SELECT * FROM ${tableName} LIMIT ${batchSize} OFFSET ${i}`;
            const data = await pool.query(dataQuery);
            
            if (data.rows.length > 0) {
              sqlDump += `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES\n`;
              
              const values = data.rows.map(row => {
                const rowValues = columnNames.map(col => {
                  const value = row[col];
                  if (value === null) return 'NULL';
                  if (typeof value === 'string') {
                    // Handle very large text fields (truncate if over 10MB to prevent memory issues)
                    if (value.length > 10 * 1024 * 1024) {
                      console.warn(`⚠️ Truncating large text field in ${tableName}.${col} (${value.length} chars -> 1MB)`);
                      const truncated = value.substring(0, 1024 * 1024) + '... [TRUNCATED BY BACKUP]';
                      return `'${truncated.replace(/'/g, "''")}'`;
                    }
                    return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
                  }
                  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
                  if (value instanceof Date) return `'${value.toISOString()}'`;
                  if (typeof value === 'object' && value !== null) {
                    // Handle JSON/JSONB fields
                    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
                  }
                  return value;
                });
                return `  (${rowValues.join(', ')})`;
              });
              
              sqlDump += values.join(',\n');
              sqlDump += ';\n\n';
              
              // Memory management: if SQL dump becomes too large (>500MB), warn but continue
              if (sqlDump.length > 500 * 1024 * 1024) {
                console.warn(`⚠️ SQL dump for ${tableName} is becoming very large (${Math.round(sqlDump.length / (1024 * 1024))}MB)`);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not export data for table ${tableName}:`, error);
        sqlDump += `-- Error exporting data for ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`;
      }
    }
    
    return sqlDump;
  } catch (error) {
    console.error(`Error generating dump for table ${tableName}:`, error);
    return `-- Error generating dump for table ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
  }
}

// Generate table dump using streaming approach
async function generateTableDumpStream(
  writeStream: any,
  pool: Pool, 
  tableName: string, 
  options: BackupOptions = {}
): Promise<void> {
  const { includeData = true, schemaOnly = false } = options;
  
  try {
    writeStream.write(`-- Table: ${tableName}\n`);
    
    // Get table schema
    const [schemaName, tableNameOnly] = tableName.includes('.') 
      ? tableName.split('.') 
      : ['public', tableName];
    
    const tableInfoQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position;
    `;
    
    const tableInfo = await pool.query(tableInfoQuery, [schemaName, tableNameOnly]);
    
    if (tableInfo.rows.length === 0) {
      writeStream.write(`-- Table ${tableName} not found\n\n`);
      return;
    }

    writeStream.write(`DROP TABLE IF EXISTS ${tableName} CASCADE;\n\n`);
    
    // Generate CREATE TABLE statement
    try {
      const createTableQuery = `
        SELECT 
          'CREATE TABLE ' || $1 || ' (' || string_agg(
            column_name || ' ' || data_type ||
            CASE 
              WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
              WHEN numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL THEN '(' || numeric_precision || ',' || numeric_scale || ')'
              ELSE ''
            END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
            ', '
          ) || ');' as create_stmt
        FROM information_schema.columns 
        WHERE table_schema = $2 AND table_name = $3
        GROUP BY table_schema, table_name;
      `;
      
      const createResult = await pool.query(createTableQuery, [tableName, schemaName, tableNameOnly]);
      if (createResult.rows.length > 0) {
        writeStream.write(createResult.rows[0].create_stmt + '\n\n');
      }
    } catch (error) {
      console.warn(`Warning: Could not generate CREATE TABLE for ${tableName}:`, error);
      writeStream.write(`-- Could not generate CREATE TABLE statement for ${tableName}\n\n`);
    }
    
    // Insert data if requested
    if (includeData && !schemaOnly) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const totalRows = parseInt(countResult.rows[0]?.count || '0');
        
        if (totalRows > 0) {
          writeStream.write(`-- Data for ${tableName} (${totalRows} rows)\n`);
          
          const columnNames = tableInfo.rows.map(col => col.column_name);
          
          // Dynamic batch size - smaller for very large tables
          let batchSize = totalRows > 100000 ? 50 : totalRows > 10000 ? 100 : 500;
          
          console.log(`📦 Backing up ${tableName}: ${totalRows} rows in batches of ${batchSize}...`);
          
          for (let i = 0; i < totalRows; i += batchSize) {
            if (totalRows > 10000 && i % (batchSize * 10) === 0) {
              const progress = ((i / totalRows) * 100).toFixed(1);
              console.log(`  📊 Progress: ${progress}% (${i}/${totalRows} rows)`);
            }
            
            const dataQuery = `SELECT * FROM ${tableName} LIMIT ${batchSize} OFFSET ${i}`;
            const data = await pool.query(dataQuery);
            
            if (data.rows.length > 0) {
              writeStream.write(`INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES\n`);
              
              const values = data.rows.map(row => {
                const rowValues = columnNames.map(col => {
                  const value = row[col];
                  if (value === null) return 'NULL';
                  if (typeof value === 'string') {
                    // Handle very large text fields by truncating if over 1MB
                    if (value.length > 1024 * 1024) {
                      const truncated = value.substring(0, 1024 * 1024) + '... [TRUNCATED BY BACKUP]';
                      return `'${truncated.replace(/'/g, "''")}'`;
                    }
                    return `'${value.replace(/'/g, "''")}'`;
                  }
                  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
                  if (value instanceof Date) return `'${value.toISOString()}'`;
                  if (typeof value === 'object' && value !== null) {
                    const jsonString = JSON.stringify(value);
                    // Handle large JSON objects
                    if (jsonString.length > 1024 * 1024) {
                      const truncated = jsonString.substring(0, 1024 * 1024) + '... [TRUNCATED BY BACKUP]';
                      return `'${truncated.replace(/'/g, "''")}'`;
                    }
                    return `'${jsonString.replace(/'/g, "''")}'`;
                  }
                  return value;
                });
                return `  (${rowValues.join(', ')})`;
              });
              
              writeStream.write(values.join(',\n'));
              writeStream.write(';\n\n');
            }
          }
        } else {
          writeStream.write(`-- Table ${tableName} is empty\n\n`);
        }
      } catch (error) {
        console.error(`⚠️ Error backing up data for ${tableName}:`, error);
        writeStream.write(`-- Error exporting data for ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`);
      }
    }
    
  } catch (error) {
    console.error(`⚠️ Error backing up table ${tableName}:`, error);
    writeStream.write(`-- Error backing up table ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`);
  }
}

// Generate full database backup using streaming
export async function generateDatabaseBackup(
  pool: Pool,
  databaseName: string,
  outputFilePath: string,
  options: BackupOptions = {}
): Promise<string> {
  const startTime = Date.now();
  
  try {
    // Create write stream for the backup file
    const writeStream = createWriteStream(outputFilePath);
    
    // Add header
    writeStream.write(`-- Database Backup: ${databaseName}\n`);
    writeStream.write(`-- Generated: ${new Date().toISOString()}\n`);
    writeStream.write(`-- Generated by: SM Admin WA Dashboard\n`);
    writeStream.write(`--\n\n`);
    
    // Get all tables
    let tables = await getAllTables(pool);
    
    // Filter tables if specified
    if (options.tablesToInclude && options.tablesToInclude.length > 0) {
      tables = tables.filter(table => 
        options.tablesToInclude!.some(pattern => 
          table.includes(pattern) || table.match(new RegExp(pattern))
        )
      );
    }
    
    if (options.tablesToExclude && options.tablesToExclude.length > 0) {
      tables = tables.filter(table => 
        !options.tablesToExclude!.some(pattern => 
          table.includes(pattern) || table.match(new RegExp(pattern))
        )
      );
    }
    
    console.log(`Backing up ${tables.length} tables from ${databaseName}`);
    
    // Generate backup for each table using streaming
    for (const table of tables) {
      console.log(`Backing up table: ${table}`);
      await generateTableDumpStream(writeStream, pool, table, options);
    }
    
    // Add footer
    const duration = Date.now() - startTime;
    writeStream.write(`-- Backup completed in ${duration}ms\n`);
    writeStream.write(`-- Tables backed up: ${tables.length}\n`);
    
    // Close the stream and wait for it to finish
    await new Promise<void>((resolve, reject) => {
      writeStream.end(() => {
        resolve();
      });
      writeStream.on('error', reject);
    });
    
    // Get file size
    const stats = await fs.stat(outputFilePath);
    const fileSizeMB = Math.round(stats.size / (1024 * 1024) * 100) / 100;
    
    console.log(`✅ Database backup completed: ${outputFilePath} (${fileSizeMB}MB)`);
    return outputFilePath;
    
  } catch (error) {
    console.error(`Error generating database backup for ${databaseName}:`, error);
    throw error;
  }
}

// Save backup to file
export async function saveBackupToFile(
  sqlDump: string,
  databaseName: string,
  backupDir: string = './backups'
): Promise<BackupResult> {
  const startTime = Date.now();
  
  try {
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `${databaseName}_backup_${timestamp}.sql`;
    const filePath = path.join(backupDir, fileName);
    
    // Write file
    await fs.writeFile(filePath, sqlDump, 'utf8');
    
    // Get file size
    const stats = await fs.stat(filePath);
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Database backup saved: ${filePath} (${stats.size} bytes, ${duration}ms)`);
    
    return {
      success: true,
      filePath,
      fileName,
      fileSize: stats.size,
      duration
    };
  } catch (error) {
    console.error('Error saving backup to file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Create combined backup file using streaming approach (no memory issues)
export async function createCombinedBackup(
  backupFiles: { name: string; filePath: string }[],
  fileName: string,
  backupDir: string = './backups'
): Promise<BackupResult> {
  const startTime = Date.now();
  
  try {
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });
    
    // Create combined SQL file with all databases
    const outputPath = path.join(backupDir, fileName);
    const writeStream = createWriteStream(outputPath);
    
    // Write header
    writeStream.write(`-- ====================================\n`);
    writeStream.write(`-- Combined Database Backup\n`);
    writeStream.write(`-- Generated: ${new Date().toISOString()}\n`);
    writeStream.write(`-- Databases: ${backupFiles.map(f => f.name).join(', ')}\n`);
    writeStream.write(`-- Created by: SM Admin WA Dashboard\n`);
    writeStream.write(`-- ====================================\n\n`);
    
    // Stream each backup file into the combined file
    for (const file of backupFiles) {
      try {
        const stats = await fs.stat(file.filePath);
        
        writeStream.write(`-- ====================================\n`);
        writeStream.write(`-- Database File: ${file.name}\n`);
        writeStream.write(`-- Size: ${formatFileSize(stats.size)}\n`);
        writeStream.write(`-- ====================================\n\n`);
        
        // Stream the file content
        const fileContent = await fs.readFile(file.filePath, 'utf8');
        writeStream.write(fileContent);
        writeStream.write(`\n\n-- End of ${file.name}\n\n`);
        
        console.log(`✅ Added ${file.name} to combined backup (${formatFileSize(stats.size)})`);
      } catch (error) {
        console.error(`⚠️ Error adding ${file.name} to combined backup:`, error);
        writeStream.write(`-- Error including ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`);
      }
    }
    
    // Add footer
    writeStream.write(`-- ====================================\n`);
    writeStream.write(`-- Backup completed at ${new Date().toISOString()}\n`);
    writeStream.write(`-- Total databases: ${backupFiles.length}\n`);
    writeStream.write(`-- ====================================\n`);
    
    // Close the write stream
    await new Promise<void>((resolve, reject) => {
      writeStream.end(() => resolve());
      writeStream.on('error', reject);
    });
    
    const stats = await fs.stat(outputPath);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Combined backup created: ${outputPath} (${formatFileSize(stats.size)}, ${duration}ms)`);
    
    // Clean up individual backup files
    for (const file of backupFiles) {
      try {
        await fs.unlink(file.filePath);
        console.log(`🗑️ Cleaned up temporary file: ${file.filePath}`);
      } catch (error) {
        console.warn(`⚠️ Could not delete temporary file ${file.filePath}:`, error);
      }
    }
    
    return {
      success: true,
      filePath: outputPath,
      fileName,
      fileSize: stats.size,
      duration
    };
    
  } catch (error) {
    console.error('Error creating combined backup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Create ZIP backup file containing SQL files
export async function createZipBackup(
  backupFiles: { name: string; filePath: string }[],
  fileName: string,
  backupDir: string = './backups'
): Promise<BackupResult> {
  const startTime = Date.now();
  
  try {
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });
    
    // Create ZIP file
    const zipPath = path.join(backupDir, fileName);
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } }); // Maximum compression
    
    // Pre-process files to get their stats (since we can't use await inside Promise constructor)
    const fileStatsPromises = backupFiles.map(async (file) => {
      try {
        const stats = await fs.stat(file.filePath);
        return { file, stats, error: null };
      } catch (error) {
        return { file, stats: null, error };
      }
    });
    
    const fileStats = await Promise.all(fileStatsPromises);
    
    return new Promise<BackupResult>((resolve, reject) => {
      // Handle archive events
      archive.on('error', (err) => {
        console.error('Archive error:', err);
        reject(err);
      });
      
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Archive warning:', err);
        } else {
          reject(err);
        }
      });
      
      output.on('close', async () => {
        try {
          const stats = await fs.stat(zipPath);
          const duration = Date.now() - startTime;
          
          console.log(`✅ ZIP backup created: ${zipPath} (${formatFileSize(stats.size)}, ${duration}ms)`);
          
          // Clean up individual SQL files
          for (const file of backupFiles) {
            try {
              await fs.unlink(file.filePath);
              console.log(`🗑️ Cleaned up temporary file: ${file.filePath}`);
            } catch (error) {
              console.warn(`⚠️ Could not delete temporary file ${file.filePath}:`, error);
            }
          }
          
          resolve({
            success: true,
            filePath: zipPath,
            fileName,
            fileSize: stats.size,
            duration
          });
        } catch (error) {
          reject(error);
        }
      });
      
      output.on('error', (err) => {
        console.error('Output stream error:', err);
        reject(err);
      });
      
      // Pipe archive data to the file
      archive.pipe(output);
      
      // Add files to archive (using pre-processed stats)
      for (const { file, stats, error } of fileStats) {
        if (error) {
          console.error(`⚠️ Error adding ${file.name} to ZIP:`, error);
          archive.append(`-- Error: Could not include ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, { name: `ERROR_${file.name}.txt` });
        } else if (stats) {
          console.log(`📦 Adding ${file.name} to ZIP (${formatFileSize(stats.size)})`);
          archive.file(file.filePath, { name: file.name });
        }
      }
      
      // Add metadata file
      const metadata = {
        created: new Date().toISOString(),
        databases: backupFiles.map(f => f.name),
        totalFiles: backupFiles.length,
        creator: 'SM Admin WA Dashboard',
        version: '1.0.0'
      };
      
      archive.append(JSON.stringify(metadata, null, 2), { name: 'backup_metadata.json' });
      
      // Finalize the archive
      archive.finalize();
    });
    
  } catch (error) {
    console.error('Error creating ZIP backup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Utility function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}