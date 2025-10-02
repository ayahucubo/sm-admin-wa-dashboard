#!/bin/bash
# Final fix - simple working home page

echo "🎯 FINAL FIX: Simple working home page"
echo "====================================="

cd /var/www/sm-admin-wa-new

# 1. Pull latest fixes
git pull origin main

# 2. Stop PM2
pm2 stop all

# 3. Clean rebuild 
rm -rf .next
NODE_ENV=production npm run build

# 4. Start PM2
pm2 start ecosystem.config.js

# 5. Wait and test
sleep 10

echo "Testing fixed application:"
echo "Root page: $(curl -sI http://localhost:3001/ | head -1)"
echo "Login page: $(curl -sI http://localhost:3001/login | head -1)"
echo "Admin page: $(curl -sI http://localhost:3001/admin | head -1)"
echo "Health API: $(curl -sI http://localhost:3001/api/health | head -1)"

echo ""
echo "External tests:"
echo "Root: $(curl -sI https://wecare.techconnect.co.id/sm-admin/ | head -1)"
echo "Login: $(curl -sI https://wecare.techconnect.co.id/sm-admin/login | head -1)"

pm2 status