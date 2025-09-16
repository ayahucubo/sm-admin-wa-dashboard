// Database setup script to check and create the n8n_mapping_sme_cb_cc_benefit table
const { Pool } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5488,
  database: 'postgres',
  user: 'n8nuser',
  password: 'P0stgres99',
};

const pool = new Pool(dbConfig);

async function checkAndCreateTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Connecting to database...');
    console.log('Database config:', {
      ...dbConfig,
      password: '[REDACTED]'
    });

    // Test connection
    const connectionTest = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database connection successful!');
    console.log('Current time:', connectionTest.rows[0].current_time);
    console.log('Database version:', connectionTest.rows[0].db_version.substring(0, 50) + '...');

    // Check if table exists
    console.log('\n📋 Checking if table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'n8n_mapping_sme_cb_cc_benefit'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log('Table exists:', tableExists);

    if (!tableExists) {
      console.log('\n🏗️  Creating table n8n_mapping_sme_cb_cc_benefit...');
      await client.query(`
        CREATE TABLE n8n_mapping_sme_cb_cc_benefit (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          cc_type VARCHAR(255),
          benefit_description TEXT,
          mapping_rules TEXT,
          status VARCHAR(50) DEFAULT 'active',
          category VARCHAR(255),
          priority INTEGER DEFAULT 1,
          notes TEXT
        );
      `);
      console.log('✅ Table created successfully!');

      // Insert some sample data
      console.log('\n📝 Inserting sample data...');
      await client.query(`
        INSERT INTO n8n_mapping_sme_cb_cc_benefit (cc_type, benefit_description, mapping_rules, status, category) VALUES
        ('Visa', 'Cashback rewards for purchases', 'Apply 1% cashback on all purchases', 'active', 'Cashback'),
        ('Mastercard', 'Travel insurance coverage', 'Automatic travel insurance for cardholders', 'active', 'Insurance'),
        ('American Express', 'Airport lounge access', 'Free access to partner airport lounges', 'active', 'Travel');
      `);
      console.log('✅ Sample data inserted!');
    } else {
      // Show table structure
      console.log('\n📊 Table structure:');
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'n8n_mapping_sme_cb_cc_benefit'
        ORDER BY ordinal_position;
      `);
      
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });

      // Show current data count
      const count = await client.query('SELECT COUNT(*) FROM n8n_mapping_sme_cb_cc_benefit');
      console.log(`\n📈 Current records: ${count.rows[0].count}`);
    }

    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndCreateTable().catch(console.error);