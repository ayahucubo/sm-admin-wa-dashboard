import { Pool } from 'pg';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// PRIMARY DATABASE CONFIGURATION (postgres) - Custom tables and mappings
const primaryDbConfig = {
  host: process.env.DB_POSTGRESDB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_POSTGRESDB_PORT || process.env.DB_PORT || '5488'),
  database: process.env.DB_POSTGRESDB_DATABASE || process.env.DB_NAME || 'postgres',
  user: process.env.DB_POSTGRESDB_USER || process.env.DB_USER || 'n8nuser',
  password: process.env.DB_POSTGRESDB_PASSWORD || process.env.DB_PASSWORD || 'P0stgres99',
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
  ssl: false, // Disable SSL for local PostgreSQL Docker instance
};

// N8N CORE DATABASE CONFIGURATION (n8ndb) - Execution and workflow data
const n8nDbConfig = {
  host: process.env.DB_N8N_HOST || 'localhost',
  port: parseInt(process.env.DB_N8N_PORT || '5488'),
  database: process.env.DB_N8N_DATABASE || 'n8ndb',
  user: process.env.DB_N8N_USER || 'n8nuser',
  password: process.env.DB_N8N_PASSWORD || 'P0stgres99',
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
  ssl: false, // Disable SSL for local PostgreSQL Docker instance
};

// Validate required environment variables in production
if (isProduction && !process.env.DB_POSTGRESDB_PASSWORD && !process.env.DB_PASSWORD) {
  throw new Error('DB_POSTGRESDB_PASSWORD or DB_PASSWORD must be set in production environment');
}

// Log configuration (without password) for debugging
console.log('Primary Database configuration:', {
  ...primaryDbConfig,
  password: primaryDbConfig.password ? '[REDACTED]' : '[NOT SET]',
  environment: process.env.NODE_ENV,
});

console.log('N8N Database configuration:', {
  ...n8nDbConfig,
  password: n8nDbConfig.password ? '[REDACTED]' : '[NOT SET]',
  environment: process.env.NODE_ENV,
});

// Create connection pools for both databases
const primaryPool = new Pool(primaryDbConfig);
const n8nPool = new Pool(n8nDbConfig);

// Generic query function for primary database (custom tables)
export async function query(text: string, params?: any[]) {
  const client = await primaryPool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Primary Database query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  } finally {
    client.release();
  }
}

// Query function for n8n core database (execution tables)
export async function queryN8n(text: string, params?: any[]) {
  const client = await n8nPool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('N8N Database query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  } finally {
    client.release();
  }
}

// Health check function
export async function checkDatabaseConnection() {
  try {
    const result = await query('SELECT NOW() as current_time, version() as db_version');
    console.log('Database connection successful:', result.rows[0]);
    return {
      success: true,
      data: result.rows[0],
      environment: process.env.NODE_ENV,
    };
  } catch (error) {
    console.error('Database connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
    };
  }
}

// Interface for database storage information
interface DatabaseSizeInfo {
  databaseName: string;
  totalSize: string;
  totalSizeBytes: number;
}

interface TableSizeInfo {
  tableName: string;
  schemaName: string;
  tableSize: string;
  tableSizeBytes: number;
  indexSize: string;
  indexSizeBytes: number;
  totalSize: string;
  totalSizeBytes: number;
  rowCount: number;
}

interface DatabaseStorageStats {
  databaseInfo: DatabaseSizeInfo;
  tables: TableSizeInfo[];
  totalTables: number;
  connectionInfo: {
    host: string;
    port: number;
    database: string;
  };
}

// Function to get database size information for primary database (postgres)
export async function getPrimaryDatabaseStorageInfo(): Promise<DatabaseStorageStats> {
  try {
    console.log('🔍 Getting primary database storage info...');
    
    // Start with basic database size query
    const dbSizeResult = await query(`
      SELECT 
        current_database() as database_name,
        pg_size_pretty(pg_database_size(current_database())) as total_size,
        pg_database_size(current_database()) as total_size_bytes
    `);

    console.log('✅ Primary DB size query successful:', dbSizeResult.rows[0]);

    // Get table information with simplified query
    let tables: TableSizeInfo[] = [];
    try {
      const tableSizeResult = await query(`
        SELECT 
          schemaname as schema_name,
          tablename as table_name,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
          pg_total_relation_size(schemaname||'.'||tablename) as total_size_bytes,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_relation_size(schemaname||'.'||tablename) as table_size_bytes
        FROM pg_tables 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 20
      `);

      console.log(`✅ Primary DB table sizes retrieved: ${tableSizeResult.rows.length} tables`);

      // Get row counts separately (this might fail in some PostgreSQL configurations)
      let rowCountMap = new Map<string, number>();
      try {
        const rowCountsResult = await query(`
          SELECT 
            schemaname as schema_name,
            tablename as table_name,
            n_tup_ins + n_tup_upd + n_tup_del as row_count
          FROM pg_stat_user_tables
          WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        `);
        
        rowCountsResult.rows.forEach(row => {
          rowCountMap.set(`${row.schema_name}.${row.table_name}`, parseInt(row.row_count) || 0);
        });
        
        console.log(`✅ Primary DB row counts retrieved: ${rowCountsResult.rows.length} tables`);
      } catch (rowCountError) {
        console.warn('⚠️ Could not get row counts for primary database:', rowCountError);
        // Continue without row counts
      }

      // Combine table size and row count data
      tables = tableSizeResult.rows.map(row => ({
        tableName: row.table_name,
        schemaName: row.schema_name,
        tableSize: row.table_size || '0 B',
        tableSizeBytes: parseInt(row.table_size_bytes) || 0,
        indexSize: '0 B', // Simplified - calculate later if needed
        indexSizeBytes: 0,
        totalSize: row.total_size || '0 B',
        totalSizeBytes: parseInt(row.total_size_bytes) || 0,
        rowCount: rowCountMap.get(`${row.schema_name}.${row.table_name}`) || 0
      }));

    } catch (tableError) {
      console.warn('⚠️ Could not get table information for primary database:', tableError);
      // Continue with empty tables array
    }

    return {
      databaseInfo: {
        databaseName: dbSizeResult.rows[0].database_name,
        totalSize: dbSizeResult.rows[0].total_size,
        totalSizeBytes: parseInt(dbSizeResult.rows[0].total_size_bytes) || 0
      },
      tables,
      totalTables: tables.length,
      connectionInfo: {
        host: primaryDbConfig.host,
        port: primaryDbConfig.port,
        database: primaryDbConfig.database
      }
    };

  } catch (error) {
    console.error('❌ Error getting primary database storage info:', error);
    throw new Error(`Primary database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to get database size information for N8N database
export async function getN8nDatabaseStorageInfo(): Promise<DatabaseStorageStats> {
  try {
    console.log('🔍 Getting N8N database storage info...');
    
    // Start with basic database size query
    const dbSizeResult = await queryN8n(`
      SELECT 
        current_database() as database_name,
        pg_size_pretty(pg_database_size(current_database())) as total_size,
        pg_database_size(current_database()) as total_size_bytes
    `);

    console.log('✅ N8N DB size query successful:', dbSizeResult.rows[0]);

    // Get table information with simplified query
    let tables: TableSizeInfo[] = [];
    try {
      const tableSizeResult = await queryN8n(`
        SELECT 
          schemaname as schema_name,
          tablename as table_name,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
          pg_total_relation_size(schemaname||'.'||tablename) as total_size_bytes,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_relation_size(schemaname||'.'||tablename) as table_size_bytes
        FROM pg_tables 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 20
      `);

      console.log(`✅ N8N DB table sizes retrieved: ${tableSizeResult.rows.length} tables`);

      // Get row counts separately (this might fail in some PostgreSQL configurations)
      let rowCountMap = new Map<string, number>();
      try {
        const rowCountsResult = await queryN8n(`
          SELECT 
            schemaname as schema_name,
            tablename as table_name,
            n_tup_ins + n_tup_upd + n_tup_del as row_count
          FROM pg_stat_user_tables
          WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        `);
        
        rowCountsResult.rows.forEach(row => {
          rowCountMap.set(`${row.schema_name}.${row.table_name}`, parseInt(row.row_count) || 0);
        });
        
        console.log(`✅ N8N DB row counts retrieved: ${rowCountsResult.rows.length} tables`);
      } catch (rowCountError) {
        console.warn('⚠️ Could not get row counts for N8N database:', rowCountError);
        // Continue without row counts
      }

      // Combine table size and row count data
      tables = tableSizeResult.rows.map(row => ({
        tableName: row.table_name,
        schemaName: row.schema_name,
        tableSize: row.table_size || '0 B',
        tableSizeBytes: parseInt(row.table_size_bytes) || 0,
        indexSize: '0 B', // Simplified - calculate later if needed
        indexSizeBytes: 0,
        totalSize: row.total_size || '0 B',
        totalSizeBytes: parseInt(row.total_size_bytes) || 0,
        rowCount: rowCountMap.get(`${row.schema_name}.${row.table_name}`) || 0
      }));

    } catch (tableError) {
      console.warn('⚠️ Could not get table information for N8N database:', tableError);
      // Continue with empty tables array
    }

    return {
      databaseInfo: {
        databaseName: dbSizeResult.rows[0].database_name,
        totalSize: dbSizeResult.rows[0].total_size,
        totalSizeBytes: parseInt(dbSizeResult.rows[0].total_size_bytes) || 0
      },
      tables,
      totalTables: tables.length,
      connectionInfo: {
        host: n8nDbConfig.host,
        port: n8nDbConfig.port,
        database: n8nDbConfig.database
      }
    };

  } catch (error) {
    console.error('❌ Error getting N8N database storage info:', error);
    throw new Error(`N8N database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to get combined storage information for both databases
export async function getAllDatabaseStorageInfo() {
  try {
    console.log('📊 Getting storage info for both databases...');
    
    // Try to get both databases, but don't fail if one fails
    let primaryStorage: DatabaseStorageStats | null = null;
    let n8nStorage: DatabaseStorageStats | null = null;
    let errors: string[] = [];

    try {
      primaryStorage = await getPrimaryDatabaseStorageInfo();
      console.log('✅ Primary database storage info retrieved successfully');
    } catch (error) {
      const errorMsg = `Primary database error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ ' + errorMsg);
      errors.push(errorMsg);
    }

    try {
      n8nStorage = await getN8nDatabaseStorageInfo();
      console.log('✅ N8N database storage info retrieved successfully');
    } catch (error) {
      const errorMsg = `N8N database error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ ' + errorMsg);
      errors.push(errorMsg);
    }

    // If both failed, return error
    if (!primaryStorage && !n8nStorage) {
      return {
        success: false,
        error: `Both database connections failed: ${errors.join(', ')}`,
        primaryDatabase: null,
        n8nDatabase: null,
        summary: {
          totalDatabases: 0,
          combinedSize: 0,
          combinedSizePretty: '0 B',
          totalTables: 0,
          retrievedAt: new Date().toISOString()
        }
      };
    }

    // Calculate combined stats from available databases
    const primarySize = primaryStorage?.databaseInfo.totalSizeBytes || 0;
    const n8nSize = n8nStorage?.databaseInfo.totalSizeBytes || 0;
    const primaryTables = primaryStorage?.totalTables || 0;
    const n8nTables = n8nStorage?.totalTables || 0;
    
    const result = {
      success: true,
      primaryDatabase: primaryStorage,
      n8nDatabase: n8nStorage,
      summary: {
        totalDatabases: (primaryStorage ? 1 : 0) + (n8nStorage ? 1 : 0),
        combinedSize: primarySize + n8nSize,
        combinedSizePretty: formatBytes(primarySize + n8nSize),
        totalTables: primaryTables + n8nTables,
        retrievedAt: new Date().toISOString()
      }
    };

    // Add warnings if some databases failed
    if (errors.length > 0) {
      (result as any).warnings = errors;
    }

    return result;
  } catch (error) {
    console.error('❌ Error getting all database storage info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve database storage information',
      primaryDatabase: null,
      n8nDatabase: null,
      summary: {
        totalDatabases: 0,
        combinedSize: 0,
        combinedSizePretty: '0 B',
        totalTables: 0,
        retrievedAt: new Date().toISOString()
      }
    };
  }
}

// Utility function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to get CC benefit mapping data
export async function getCCBenefitMappingData() {
  try {
    const result = await query('SELECT * FROM n8n_mapping_sme_cb_cc_benefit ORDER BY id');
    return result.rows;
  } catch (error) {
    console.error('Error fetching CC benefit mapping data:', error);
    throw error;
  }
}

// Function to create new CC benefit mapping record
export async function createCCBenefitMapping(data: Record<string, any>) {
  try {
    // Get column names from the data object (excluding id as it's auto-generated)
    const columns = Object.keys(data).filter(key => key !== 'id' && data[key] !== undefined && data[key] !== null);
    
    if (columns.length === 0) {
      throw new Error('No valid data provided for insert operation');
    }
    
    const values = columns.map(col => data[col]);
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    
    const query_text = `
      INSERT INTO n8n_mapping_sme_cb_cc_benefit (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await query(query_text, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating CC benefit mapping record:', error);
    throw error;
  }
}

// Function to update CC benefit mapping record
export async function updateCCBenefitMapping(id: number, data: Record<string, any>) {
  try {
    // Get column names from the data object (excluding id)
    const columns = Object.keys(data).filter(key => key !== 'id' && data[key] !== undefined && data[key] !== null);
    
    if (columns.length === 0) {
      throw new Error('No valid data provided for update operation');
    }
    
    const values = columns.map(col => data[col]);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    
    const query_text = `
      UPDATE n8n_mapping_sme_cb_cc_benefit 
      SET ${setClause}
      WHERE id = $${columns.length + 1}
      RETURNING *
    `;
    
    const result = await query(query_text, [...values, id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating CC benefit mapping record:', error);
    throw error;
  }
}

// Function to delete CC benefit mapping record
export async function deleteCCBenefitMapping(id: number) {
  try {
    const result = await query(
      'DELETE FROM n8n_mapping_sme_cb_cc_benefit WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting CC benefit mapping record:', error);
    throw error;
  }
}

// Function to get table schema/columns
export async function getCCBenefitMappingSchema() {
  try {
    const result = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'n8n_mapping_sme_cb_cc_benefit'
      ORDER BY ordinal_position
    `);
    
    if (result.rows && result.rows.length > 0) {
      return result.rows;
    }
    
    // Fallback schema based on actual table structure
    return [
      { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'company_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'company_code_text', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'personnel_area', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'personnel_area_text', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'personnel_subarea', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'personnel_subarea_text', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'pilar_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'skema_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'skema_code_text', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null },
      { column_name: 'updated_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null }
    ];
  } catch (error) {
    console.error('Error fetching table schema:', error);
    // Return fallback schema if query fails
    return [
      { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'company_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'company_code_text', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'personnel_area', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'personnel_area_text', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'personnel_subarea', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'personnel_subarea_text', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'pilar_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'skema_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'skema_code_text', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null },
      { column_name: 'updated_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null }
    ];
  }
}

// Function to get CC PP mapping data
export async function getCCPPMappingData() {
  try {
    const result = await query('SELECT * FROM n8n_mapping_bu_cc_pp ORDER BY id');
    return result.rows;
  } catch (error) {
    console.error('Error fetching CC PP mapping data:', error);
    throw error;
  }
}

// Function to create new CC PP mapping record
export async function createCCPPMapping(data: Record<string, any>) {
  try {
    // Get column names from the data object (excluding id as it's auto-generated)
    const columns = Object.keys(data).filter(key => key !== 'id' && data[key] !== undefined && data[key] !== null);
    
    if (columns.length === 0) {
      throw new Error('No valid data provided for insert operation');
    }
    
    const values = columns.map(col => data[col]);
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    
    const query_text = `
      INSERT INTO n8n_mapping_bu_cc_pp (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await query(query_text, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating CC PP mapping record:', error);
    throw error;
  }
}

// Function to update CC PP mapping record
export async function updateCCPPMapping(id: number, data: Record<string, any>) {
  try {
    // Get column names from the data object (excluding id)
    const columns = Object.keys(data).filter(key => key !== 'id' && data[key] !== undefined && data[key] !== null);
    
    if (columns.length === 0) {
      throw new Error('No valid data provided for update operation');
    }
    
    const values = columns.map(col => data[col]);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    
    const query_text = `
      UPDATE n8n_mapping_bu_cc_pp 
      SET ${setClause}
      WHERE id = $${columns.length + 1}
      RETURNING *
    `;
    
    const result = await query(query_text, [...values, id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating CC PP mapping record:', error);
    throw error;
  }
}

// Function to delete CC PP mapping record
export async function deleteCCPPMapping(id: number) {
  try {
    const result = await query(
      'DELETE FROM n8n_mapping_bu_cc_pp WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting CC PP mapping record:', error);
    throw error;
  }
}

// Function to get CC PP mapping table schema/columns
export async function getCCPPMappingSchema() {
  try {
    const result = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'n8n_mapping_bu_cc_pp'
      ORDER BY ordinal_position
    `);
    
    if (result.rows && result.rows.length > 0) {
      return result.rows;
    }
    
    // Fallback schema based on actual table structure
    return [
      { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'company', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'company_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'daftar_isi_file_id', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'kategori', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'kategori_sub', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'knowledge_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'sme', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null },
      { column_name: 'updated_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null }
    ];
  } catch (error) {
    console.error('Error fetching CC PP mapping table schema:', error);
    // Return fallback schema if query fails
    return [
      { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'company', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'company_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'daftar_isi_file_id', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'kategori', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'kategori_sub', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'knowledge_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'sme', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null },
      { column_name: 'updated_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null }
    ];
  }
}

// Menu Master functions for n8n_param_menu_master table
export async function getMenuMasterData() {
  try {
    const result = await query('SELECT * FROM n8n_param_menu_master ORDER BY id');
    return result.rows;
  } catch (error) {
    console.error('Error fetching menu master data:', error);
    throw error;
  }
}

export async function getMenuMasterSchema() {
  try {
    const result = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'n8n_param_menu_master'
      ORDER BY ordinal_position
    `);
    
    if (result.rows && result.rows.length > 0) {
      return result.rows;
    }
    
    // Fallback schema based on actual table structure
    return [
      { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'company_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'menu', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'keyword', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null },
      { column_name: 'updated_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null }
    ];
  } catch (error) {
    console.error('Error fetching menu master table schema:', error);
    // Return fallback schema if query fails
    return [
      { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
      { column_name: 'company_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'menu', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'keyword', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null },
      { column_name: 'updated_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null }
    ];
  }
}

export async function createMenuMaster(data: Record<string, any>) {
  try {
    // Validate that we have at least one non-empty field
    const hasData = Object.keys(data).some(key => 
      data[key] !== null && data[key] !== undefined && data[key] !== ''
    );
    
    if (!hasData) {
      throw new Error('Please provide at least one field to create a record');
    }

    // Remove undefined/null values and system fields
    const cleanData = Object.entries(data)
      .filter(([key, value]) => 
        value !== null && 
        value !== undefined && 
        value !== '' &&
        key !== 'id' &&
        !key.includes('created_at') &&
        !key.includes('updated_at')
      )
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    if (Object.keys(cleanData).length === 0) {
      throw new Error('No valid data provided for menu master creation');
    }

    const columns = Object.keys(cleanData);
    const values = Object.values(cleanData);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    
    const query_text = `
      INSERT INTO n8n_param_menu_master (${columns.join(', ')}, created_at, updated_at) 
      VALUES (${placeholders}, NOW(), NOW()) 
      RETURNING *
    `;
    
    const result = await query(query_text, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating menu master record:', error);
    throw error;
  }
}

export async function updateMenuMaster(id: number, data: Record<string, any>) {
  try {
    // Validate that we have at least one non-empty field
    const hasData = Object.keys(data).some(key => 
      data[key] !== null && data[key] !== undefined && data[key] !== '' &&
      key !== 'id' &&
      !key.includes('created_at') &&
      !key.includes('updated_at')
    );
    
    if (!hasData) {
      throw new Error('Please provide at least one field to update');
    }

    // Remove undefined/null values and system fields
    const cleanData = Object.entries(data)
      .filter(([key, value]) => 
        value !== null && 
        value !== undefined && 
        value !== '' &&
        key !== 'id' &&
        !key.includes('created_at') &&
        !key.includes('updated_at')
      )
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    if (Object.keys(cleanData).length === 0) {
      throw new Error('No valid data provided for menu master update');
    }

    const updates = Object.keys(cleanData).map((key, index) => `${key} = $${index + 1}`);
    const values = Object.values(cleanData);
    
    const query_text = `
      UPDATE n8n_param_menu_master 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length + 1}
      RETURNING *
    `;
    
    const result = await query(query_text, [...values, id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating menu master record:', error);
    throw error;
  }
}

export async function deleteMenuMaster(id: number) {
  try {
    const result = await query('DELETE FROM n8n_param_menu_master WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting menu master record:', error);
    throw error;
  }
}

// Function to get chat history with filters
export async function getChatHistory(filters?: {
  currentMenu?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    // Base query as provided in the requirements
    let queryText = `
      SELECT
        em."executionId" as "execution_id",
        ee."startedAt" as "started_at",
        em.value as "nohp",
        em1.value as "chat",
        em2.value as "chat_response",
        em3.value as "current_menu",
        em4.value as "chat_name",
        ee."workflowId" as "workflow_id",
        we."name" as "workflow_name"
      FROM
        execution_metadata em
      INNER JOIN execution_metadata em1 ON em1."executionId" = em."executionId" AND em1."key" = 'chatInput'
      INNER JOIN execution_metadata em2 ON em2."executionId" = em."executionId" AND em2.key = 'chatResponse'
      INNER JOIN execution_metadata em3 ON em3."executionId" = em."executionId" AND em3.key = 'currentMenu'
      LEFT JOIN execution_metadata em4 ON em4."executionId" = em."executionId" AND em4.key = 'chatName'
      INNER JOIN "execution_entity" ee ON ee.id = em."executionId"
      INNER JOIN workflow_entity we ON we.id = ee."workflowId"
      WHERE em."key" = 'chatId'
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add dynamic filters
    if (filters?.currentMenu) {
      queryText += ` AND em3.value = $${paramIndex}`;
      queryParams.push(filters.currentMenu);
      paramIndex++;
    }

    if (filters?.startDate) {
      queryText += ` AND ee."startedAt" >= $${paramIndex}`;
      queryParams.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      queryText += ` AND ee."startedAt" <= $${paramIndex}`;
      queryParams.push(filters.endDate + 'T23:59:59.999Z'); // Include full end date
      paramIndex++;
    }

    // Add ordering
    queryText += ` ORDER BY ee."startedAt" DESC`;

    // Add pagination
    if (filters?.limit) {
      queryText += ` LIMIT $${paramIndex}`;
      queryParams.push(filters.limit);
      paramIndex++;
    }

    if (filters?.offset) {
      queryText += ` OFFSET $${paramIndex}`;
      queryParams.push(filters.offset);
      paramIndex++;
    }

    console.log('Executing chat history query:', queryText);
    console.log('Query parameters:', queryParams);

    const result = await queryN8n(queryText, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
}

// Function to get total count of chat history (for pagination)
export async function getChatHistoryCount(filters?: {
  currentMenu?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    let queryText = `
      SELECT COUNT(*) as total
      FROM
        execution_metadata em
      INNER JOIN execution_metadata em1 ON em1."executionId" = em."executionId" AND em1."key" = 'chatInput'
      INNER JOIN execution_metadata em2 ON em2."executionId" = em."executionId" AND em2.key = 'chatResponse'
      INNER JOIN execution_metadata em3 ON em3."executionId" = em."executionId" AND em3.key = 'currentMenu'
      LEFT JOIN execution_metadata em4 ON em4."executionId" = em."executionId" AND em4.key = 'chatName'
      INNER JOIN "execution_entity" ee ON ee.id = em."executionId"
      INNER JOIN workflow_entity we ON we.id = ee."workflowId"
      WHERE em."key" = 'chatId'
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add same filters as the main query
    if (filters?.currentMenu) {
      queryText += ` AND em3.value = $${paramIndex}`;
      queryParams.push(filters.currentMenu);
      paramIndex++;
    }

    if (filters?.startDate) {
      queryText += ` AND ee."startedAt" >= $${paramIndex}`;
      queryParams.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      queryText += ` AND ee."startedAt" <= $${paramIndex}`;
      queryParams.push(filters.endDate + 'T23:59:59.999Z');
      paramIndex++;
    }

    const result = await queryN8n(queryText, queryParams);
    return parseInt(result.rows[0].total);
  } catch (error) {
    console.error('Error fetching chat history count:', error);
    throw error;
  }
}

// Close both pools when the application shuts down
export async function closePool() {
  await Promise.all([
    primaryPool.end(),
    n8nPool.end()
  ]);
}

export { primaryPool, n8nPool };
export default primaryPool;
