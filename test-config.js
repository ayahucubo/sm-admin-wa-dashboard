// Simple test to verify database configuration
console.log('=== Database Configuration Test ===');
console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
console.log('DB_PORT:', process.env.DB_PORT || '5488');
console.log('DB_NAME:', process.env.DB_NAME || 'postgres');
console.log('DB_USER:', process.env.DB_USER || 'n8nuser');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Test the database import
try {
  const { checkDatabaseConnection } = require('./src/utils/database.js');
  console.log('✅ Database module imported successfully');
} catch (error) {
  console.log('❌ Error importing database module:', error.message);
}