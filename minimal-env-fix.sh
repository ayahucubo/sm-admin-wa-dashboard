#!/bin/bash
# Create minimal working environment without JWT requirements

echo "🔧 Creating minimal environment for N8N webhook auth"
echo "=================================================="

cd /var/www/sm-admin-wa-new

# Create a minimal .env that doesn't require JWT secrets
cat > .env << 'EOF'
# Minimal production environment for N8N webhook authentication
PORT=3001
NODE_ENV=production

# Database Type
DB_TYPE=postgresdb

# Primary Database (postgres)
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5488
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=n8nuser
DB_POSTGRESDB_PASSWORD=P0stgres99

# Alternative format (for compatibility)
DB_HOST=localhost
DB_PORT=5488
DB_NAME=postgres
DB_USER=n8nuser
DB_PASSWORD=P0stgres99

# N8N Core Database (n8ndb)
DB_N8N_HOST=localhost
DB_N8N_PORT=5488
DB_N8N_DATABASE=n8ndb
DB_N8N_USER=n8nuser
DB_N8N_PASSWORD=P0stgres99

# Production specific settings
DB_MAX_CONNECTIONS=20
DB_CONNECTION_TIMEOUT=2000
DB_IDLE_TIMEOUT=30000
DB_SSL=false

# Disable JWT/NextAuth features (using N8N webhook instead)
DISABLE_JWT_AUTH=true
EOF

echo "✅ Created minimal .env file"

# Stop PM2
pm2 stop all

# Clean rebuild
rm -rf .next
NODE_ENV=production npm run build

# Start with PM2
pm2 start ecosystem.config.js

sleep 10

echo ""
echo "🧪 Testing minimal environment:"
echo "Root: $(curl -sI http://localhost:3001/ 2>/dev/null | head -1 || echo 'FAILED')"
echo "API: $(curl -sI http://localhost:3001/api/health 2>/dev/null | head -1 || echo 'FAILED')"

pm2 status