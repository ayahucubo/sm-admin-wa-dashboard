#!/bin/bash

# PostgreSQL Database Connection Fix - Server Deployment Script
# Run this script on the server: gibra@gcp-hr-applications

set -e  # Exit on any error

echo "🚀 Starting PostgreSQL Database Fix Deployment..."
echo "Timestamp: $(date)"
echo "Current user: $(whoami)"
echo "Current directory: $(pwd)"

# Configuration
APP_DIR="/var/www/sm-admin-wa-new"
BACKUP_DIR="/var/www/sm-admin-wa-new-backup-$(date +%Y%m%d_%H%M%S)"

# Step 1: Backup current installation
echo "📦 Creating backup..."
if [ -d "$APP_DIR" ]; then
    sudo cp -r "$APP_DIR" "$BACKUP_DIR"
    echo "✅ Backup created at: $BACKUP_DIR"
else
    echo "❌ Application directory not found: $APP_DIR"
    exit 1
fi

# Step 2: Navigate to application directory
cd "$APP_DIR"
echo "📁 Changed to application directory: $(pwd)"

# Step 3: Stop the application (try multiple methods)
echo "🛑 Stopping application..."
# Try PM2 first
if command -v pm2 >/dev/null 2>&1; then
    pm2 stop sm-admin-wa-dashboard || echo "PM2 not running or app not found"
fi

# Try systemd
if systemctl is-active --quiet sm-admin-wa-dashboard; then
    sudo systemctl stop sm-admin-wa-dashboard || echo "Systemd service not found"
fi

# Kill any remaining Node processes
pkill -f "node.*next" || echo "No Node processes found"

# Step 4: Update files (if git is available)
echo "🔄 Updating files..."
if [ -d ".git" ]; then
    echo "Git repository found, pulling latest changes..."
    git pull origin main || echo "Git pull failed, continuing with manual deployment"
else
    echo "No git repository found, manual file upload required"
fi

# Step 5: Set environment variables
echo "🔧 Setting up environment..."
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "✅ Production environment variables set"
else
    echo "⚠️  .env.production not found, creating basic environment file..."
    cat > .env << EOF
NODE_ENV=production
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5488
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=n8nuser
DB_POSTGRESDB_PASSWORD=P0stgres99
DB_TYPE=postgresdb
EOF
fi

# Step 6: Install dependencies and build
echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building application..."
npm run build

# Step 7: Test the build
echo "🧪 Testing application..."
echo "Starting test server in background..."
npm start &
SERVER_PID=$!
sleep 10

# Test endpoints
echo "Testing API endpoints..."

# Test simple endpoint
echo "Testing /api/test..."
curl -f http://localhost:3000/api/test || echo "❌ /api/test failed"

# Test debug endpoint
echo "Testing /api/debug..."
curl -f http://localhost:3000/api/debug || echo "❌ /api/debug failed"

# Test health endpoint
echo "Testing /api/health..."
curl -f http://localhost:3000/api/health || echo "❌ /api/health failed"

# Test CC benefit mapping
echo "Testing /api/cc-benefit-mapping..."
curl -f http://localhost:3000/api/cc-benefit-mapping || echo "❌ /api/cc-benefit-mapping failed"

# Stop test server
kill $SERVER_PID || echo "Test server already stopped"
sleep 5

# Step 8: Start production service
echo "🚀 Starting production service..."

# Try different startup methods
if command -v pm2 >/dev/null 2>&1; then
    echo "Starting with PM2..."
    pm2 start npm --name "sm-admin-wa-dashboard" -- start
    pm2 save
elif systemctl list-unit-files | grep -q sm-admin-wa-dashboard; then
    echo "Starting with systemd..."
    sudo systemctl start sm-admin-wa-dashboard
    sudo systemctl enable sm-admin-wa-dashboard
else
    echo "Starting with nohup..."
    nohup npm start > app.log 2>&1 &
    echo $! > server.pid
fi

# Step 9: Final verification
echo "⏳ Waiting for service to start..."
sleep 15

echo "🔍 Final verification..."
# Test endpoints again
curl -f http://localhost:3000/api/test && echo "✅ API test endpoint working" || echo "❌ API test endpoint failed"
curl -f http://localhost:3000/api/health && echo "✅ Health endpoint working" || echo "❌ Health endpoint failed"

# Step 10: Display status
echo ""
echo "🎉 Deployment completed!"
echo "📊 Status summary:"

# Check if service is running
if pgrep -f "node.*next" >/dev/null; then
    echo "✅ Node.js process is running"
else
    echo "❌ Node.js process is not running"
fi

# Show service status
if command -v pm2 >/dev/null 2>&1; then
    echo "PM2 status:"
    pm2 list | grep sm-admin-wa-dashboard || echo "Not running in PM2"
fi

if systemctl list-unit-files | grep -q sm-admin-wa-dashboard; then
    echo "Systemd status:"
    systemctl status sm-admin-wa-dashboard --no-pager || echo "Not running in systemd"
fi

echo ""
echo "📝 Next steps:"
echo "1. Test the web interface: http://your-domain/admin/mapping-cc-benefit"
echo "2. Monitor logs: tail -f app.log (or pm2 logs sm-admin-wa-dashboard)"
echo "3. If issues persist, check the troubleshooting section in POSTGRESQL_FIX_DEPLOYMENT.md"
echo ""
echo "🔧 Troubleshooting commands:"
echo "curl http://localhost:3000/api/debug    # Detailed debug information"
echo "curl http://localhost:3000/api/test     # Simple API test"
echo "curl http://localhost:3000/api/health   # Database health check"
echo ""
echo "📁 Backup location: $BACKUP_DIR"