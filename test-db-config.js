// Test script to determine correct database configuration
const { Pool } = require('pg');

async function testDatabaseConnection(config, description) {
  console.log(`\n🔍 Testing ${description}...`);
  console.log('Config:', {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password ? '[SET]' : '[NOT SET]'
  });

  const pool = new Pool(config);
  
  try {
    const client = await pool.connect();
    
    // Test basic connection
    const result = await client.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log('✅ Connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('Current database:', result.rows[0].db_name);
    
    // Test if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'n8n_mapping_sme_cb_cc_benefit'
      ) as table_exists;
    `);
    
    console.log('Table exists:', tableCheck.rows[0].table_exists);
    
    if (tableCheck.rows[0].table_exists) {
      const countResult = await client.query('SELECT COUNT(*) FROM n8n_mapping_sme_cb_cc_benefit');
      console.log('Record count:', countResult.rows[0].count);
    }
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    await pool.end();
    return false;
  }
}

async function runTests() {
  console.log('🧪 Database Configuration Tests');
  console.log('='.repeat(50));
  
  // Test 1: n8ndb database with n8nuser
  await testDatabaseConnection({
    host: 'localhost',
    port: 5488,
    database: 'n8ndb',
    user: 'n8nuser',
    password: 'P0stgres99'
  }, 'n8ndb database with n8nuser');
  
  // Test 2: postgres database with n8nuser
  await testDatabaseConnection({
    host: 'localhost',
    port: 5488,
    database: 'postgres',
    user: 'n8nuser',
    password: 'P0stgres99'
  }, 'postgres database with n8nuser');
  
  // Test 3: n8ndb database with postgres user
  await testDatabaseConnection({
    host: 'localhost',
    port: 5488,
    database: 'n8ndb',
    user: 'postgres',
    password: 'P0stgres99'
  }, 'n8ndb database with postgres user');
  
  // Test 4: postgres database with postgres user
  await testDatabaseConnection({
    host: 'localhost',
    port: 5488,
    database: 'postgres',
    user: 'postgres',
    password: 'P0stgres99'
  }, 'postgres database with postgres user');
  
  console.log('\n🎯 Test completed! Use the working configuration for your application.');
}

runTests().catch(console.error);