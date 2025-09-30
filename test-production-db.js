// Production Database Connection Test
const { Pool } = require('pg');

// Load production environment variables
require('dotenv').config({ path: '.env.production' });

console.log('🔍 Testing Production Database Connections...');
console.log('Environment:', process.env.NODE_ENV);
console.log('');

const testDatabase = async (name, config) => {
  console.log(`Testing ${name}...`);
  console.log(`Config: ${config.host}:${config.port}/${config.database} as ${config.user}`);
  
  const pool = new Pool(config);
  
  try {
    const client = await pool.connect();
    
    // Test basic connection
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log(`✅ ${name} connected successfully`);
    console.log(`   Server time: ${timeResult.rows[0].current_time}`);
    
    // Test database access
    const dbResult = await client.query('SELECT current_database() as db_name');
    console.log(`   Database: ${dbResult.rows[0].db_name}`);
    
    // Test some basic queries depending on database
    if (name === 'Primary Database') {
      try {
        const tableCheck = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name LIKE 'n8n_mapping%' 
          LIMIT 3
        `);
        console.log(`   Found ${tableCheck.rows.length} mapping tables`);
        if (tableCheck.rows.length > 0) {
          tableCheck.rows.forEach(row => console.log(`     - ${row.table_name}`));
        }
      } catch (err) {
        console.log(`   ⚠️  Could not list mapping tables: ${err.message}`);
      }
    } else if (name === 'N8N Database') {
      try {
        const execCount = await client.query(`
          SELECT COUNT(*) as count 
          FROM execution_entity 
          WHERE "startedAt" > NOW() - INTERVAL '7 days'
        `);
        console.log(`   Recent executions (7 days): ${execCount.rows[0].count}`);
      } catch (err) {
        console.log(`   ⚠️  Could not count executions: ${err.message}`);
      }
    }
    
    client.release();
    console.log(`✅ ${name} test completed successfully\n`);
    
  } catch (error) {
    console.error(`❌ ${name} connection failed:`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.error('');
    throw error;
  } finally {
    await pool.end();
  }
};

const runTests = async () => {
  try {
    // Primary database configuration
    const primaryConfig = {
      host: process.env.DB_POSTGRESDB_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_POSTGRESDB_PORT || process.env.DB_PORT || '5488'),
      database: process.env.DB_POSTGRESDB_DATABASE || process.env.DB_NAME || 'postgres',
      user: process.env.DB_POSTGRESDB_USER || process.env.DB_USER || 'n8nuser',
      password: process.env.DB_POSTGRESDB_PASSWORD || process.env.DB_PASSWORD || 'P0stgres99',
      connectionTimeoutMillis: 5000,
    };

    // N8N database configuration
    const n8nConfig = {
      host: process.env.DB_N8N_HOST || 'localhost',
      port: parseInt(process.env.DB_N8N_PORT || '5488'),
      database: process.env.DB_N8N_DATABASE || 'n8ndb',
      user: process.env.DB_N8N_USER || 'n8nuser',
      password: process.env.DB_N8N_PASSWORD || 'P0stgres99',
      connectionTimeoutMillis: 5000,
    };

    console.log('🔧 Configuration Summary:');
    console.log(`Primary DB: ${primaryConfig.host}:${primaryConfig.port}/${primaryConfig.database}`);
    console.log(`N8N DB: ${n8nConfig.host}:${n8nConfig.port}/${n8nConfig.database}`);
    console.log('');

    // Test both databases
    await testDatabase('Primary Database', primaryConfig);
    await testDatabase('N8N Database', n8nConfig);
    
    console.log('🎉 All database connections successful!');
    console.log('✅ Production environment is ready to start');
    
  } catch (error) {
    console.error('💥 Database connection test failed!');
    console.error('');
    console.error('🔧 Troubleshooting tips:');
    console.error('1. Check if port forwarding is active: gcloud compute ssh gcp-hr-applications -- -L 5488:localhost:5488');
    console.error('2. Verify PostgreSQL is running in Docker on the server');
    console.error('3. Check if both databases (postgres, n8ndb) exist');
    console.error('4. Verify credentials in .env.production');
    console.error('');
    process.exit(1);
  }
};

runTests();
