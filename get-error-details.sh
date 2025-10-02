#!/bin/bash
# Get detailed error information

echo "🔍 DETAILED ERROR DIAGNOSIS"
echo "=========================="

cd /var/www/sm-admin-wa-new

# Stop PM2
pm2 stop all 2>/dev/null || true

# Kill any processes on port 3001
sudo fuser -k 3001/tcp 2>/dev/null || true

# Try to start and capture full error output
echo "Starting Next.js and capturing errors..."
echo "========================================"

NODE_ENV=production PORT=3001 npm start 2>&1 | head -50