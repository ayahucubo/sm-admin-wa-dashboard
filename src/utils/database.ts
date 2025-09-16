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
  ssl: false, // Disable SSL for local PostgreSQL Docker instance
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

// Close the pool when the application shuts down
export async function closePool() {
  await pool.end();
}

export default pool;
