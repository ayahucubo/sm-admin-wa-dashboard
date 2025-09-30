# Production Deployment Script for SM Admin WA Dashboard (PowerShell)

Write-Host "🚀 Starting production deployment..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ Error: .env.production file not found. Please create it first." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci --only=production

Write-Host "🏗️  Building the application..." -ForegroundColor Yellow
npm run build

Write-Host "🧪 Testing database connection..." -ForegroundColor Yellow

# Create a temporary test script
$testScript = @"
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const testDb = async () => {
  // Test primary database
  const primaryPool = new Pool({
    host: process.env.DB_POSTGRESDB_HOST || 'localhost',
    port: parseInt(process.env.DB_POSTGRESDB_PORT || '5488'),
    database: process.env.DB_POSTGRESDB_DATABASE || 'postgres',
    user: process.env.DB_POSTGRESDB_USER || 'n8nuser',
    password: process.env.DB_POSTGRESDB_PASSWORD || 'P0stgres99',
    connectionTimeoutMillis: 5000,
  });

  // Test n8n database
  const n8nPool = new Pool({
    host: process.env.DB_N8N_HOST || 'localhost',
    port: parseInt(process.env.DB_N8N_PORT || '5488'),
    database: process.env.DB_N8N_DATABASE || 'n8ndb',
    user: process.env.DB_N8N_USER || 'n8nuser',
    password: process.env.DB_N8N_PASSWORD || 'P0stgres99',
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('Testing primary database connection...');
    const client1 = await primaryPool.connect();
    const result1 = await client1.query('SELECT NOW()');
    console.log('✅ Primary database connected:', result1.rows[0].now);
    client1.release();

    console.log('Testing n8n database connection...');
    const client2 = await n8nPool.connect();
    const result2 = await client2.query('SELECT NOW()');
    console.log('✅ N8N database connected:', result2.rows[0].now);
    client2.release();

    console.log('✅ Database connections successful!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await primaryPool.end();
    await n8nPool.end();
  }
};

testDb();
"@

$testScript | Out-File -FilePath "test-db-connection.js" -Encoding UTF8

try {
    node "test-db-connection.js"
    Remove-Item "test-db-connection.js" -Force
}
catch {
    Write-Host "❌ Database connection test failed" -ForegroundColor Red
    Remove-Item "test-db-connection.js" -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "🌟 Starting production server..." -ForegroundColor Green
Write-Host "📍 Server will be available at: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🔧 Make sure your port forwarding is active: gcloud compute ssh gcp-hr-applications -- -L 5488:localhost:5488" -ForegroundColor Yellow
Write-Host ""

$env:NODE_ENV = "production"
npm start