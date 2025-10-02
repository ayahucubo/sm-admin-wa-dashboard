#!/bin/bash
# Fix 404 routing issues - rebuild and restart

echo "🔧 Fixing 404 Routing Issues"
echo "============================"

cd /var/www/sm-admin-wa-new

# 1. Stop PM2
echo "⏹️ Stopping PM2..."
pm2 stop all

# 2. Pull latest configuration fixes
echo "📥 Pulling latest fixes..."
git pull origin main

# 3. Copy environment
echo "📋 Setting up environment..."
cp .env.production .env

# 4. Clean build
echo "🧹 Cleaning previous build..."
rm -rf .next

# 5. Rebuild application
echo "🔨 Rebuilding application..."
NODE_ENV=production npm run build

# 6. Check build success
if [ ! -d ".next" ]; then
    echo "❌ Build failed!"
    exit 1
fi

# 7. Start PM2
echo "▶️ Starting PM2..."
pm2 start ecosystem.config.js

# 8. Wait and test
echo "⏳ Waiting for application to start..."
sleep 10

# 9. Test local routes
echo "🧪 Testing local routes..."
echo "Root: $(curl -sI http://localhost:3001/ | head -1)"
echo "Login: $(curl -sI http://localhost:3001/login | head -1)" 
echo "Admin: $(curl -sI http://localhost:3001/admin | head -1)"
echo "Health API: $(curl -sI http://localhost:3001/api/health | head -1)"

# 10. Test external routes
echo ""
echo "🌐 Testing external routes..."
echo "Root: $(curl -sI https://wecare.techconnect.co.id/sm-admin/ | head -1)"
echo "Login: $(curl -sI https://wecare.techconnect.co.id/sm-admin/login | head -1)"
echo "Admin: $(curl -sI https://wecare.techconnect.co.id/sm-admin/admin | head -1)"

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "✅ Fix completed!"
echo "Try accessing: https://wecare.techconnect.co.id/sm-admin/"