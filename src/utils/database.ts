import { Pool } from 'pg';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Database configuration with environment-specific defaults
const dbConfig = {
  host: process.env.DB_POSTGRESDB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_POSTGRESDB_PORT || process.env.DB_PORT || '5488'),
  database: process.env.DB_POSTGRESDB_DATABASE || process.env.DB_NAME || 'postgres',
  user: process.env.DB_POSTGRESDB_USER || process.env.DB_USER || 'n8nuser',
  password: process.env.DB_POSTGRESDB_PASSWORD || process.env.DB_PASSWORD || 'P0stgres99',
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
  ssl: isProduction ? { rejectUnauthorized: false } : false, // Enable SSL for production
};

// Validate required environment variables in production
if (isProduction && !process.env.DB_POSTGRESDB_PASSWORD && !process.env.DB_PASSWORD) {
  throw new Error('DB_POSTGRESDB_PASSWORD or DB_PASSWORD must be set in production environment');
}

// Log configuration (without password) for debugging
console.log('Database configuration:', {
  ...dbConfig,
  password: dbConfig.password ? '[REDACTED]' : '[NOT SET]',
  environment: process.env.NODE_ENV,
});

// Create a connection pool for PostgreSQL
const pool = new Pool(dbConfig);

// Generic query function with better error handling
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
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
    const columns = Object.keys(data).filter(key => key !== 'id');
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
    const columns = Object.keys(data).filter(key => key !== 'id');
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
    return result.rows;
  } catch (error) {
    console.error('Error fetching table schema:', error);
    throw error;
  }
}

// Close the pool when the application shuts down
export async function closePool() {
  await pool.end();
}

export default pool;
