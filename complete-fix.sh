#!/bin/bash
# Complete fix for basePath routing issues

echo "🔧 COMPLETE FIX: Removing basePath and fixing nginx"
echo "================================================="

cd /var/www/sm-admin-wa-new

# 1. Stop PM2
echo "⏹️ Stopping PM2..."
pm2 stop all

# 2. Pull latest fixes
echo "📥 Pulling latest fixes..."
git pull origin main

# 3. Update nginx configuration
echo "🌐 Updating nginx configuration..."
sudo cp nginx-config-fix.conf /etc/nginx/sites-available/wecare.techconnect.co.id

# 4. Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration test failed!"
    exit 1
fi

# 5. Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

# 6. Set environment
echo "📋 Setting up environment..."
cp .env.production .env

# 7. Clean and rebuild
echo "🧹 Cleaning and rebuilding..."
rm -rf .next
NODE_ENV=production npm run build

# 8. Start PM2
echo "▶️ Starting PM2..."
pm2 start ecosystem.config.js

# 9. Wait for startup
echo "⏳ Waiting for application..."
sleep 15

# 10. Test all routes
echo "🧪 Testing routes..."
echo ""
echo "Local tests:"
echo "Root (/)       : $(curl -sI http://localhost:3001/ | head -1)"
echo "Login (/login) : $(curl -sI http://localhost:3001/login | head -1)"
echo "Admin (/admin) : $(curl -sI http://localhost:3001/admin | head -1)"
echo "Health API     : $(curl -sI http://localhost:3001/api/health | head -1)"

echo ""
echo "External tests (through nginx):"
echo "Root           : $(curl -sI https://wecare.techconnect.co.id/sm-admin/ | head -1)"
echo "Login          : $(curl -sI https://wecare.techconnect.co.id/sm-admin/login | head -1)"
echo "Admin          : $(curl -sI https://wecare.techconnect.co.id/sm-admin/admin | head -1)"
echo "Health API     : $(curl -sI https://wecare.techconnect.co.id/sm-admin/api/health | head -1)"

# 11. Show status
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "✅ COMPLETE FIX APPLIED!"
echo ""
echo "🎯 Try these URLs:"
echo "   https://wecare.techconnect.co.id/sm-admin/"
echo "   https://wecare.techconnect.co.id/sm-admin/login"
echo "   https://wecare.techconnect.co.id/sm-admin/admin"
echo ""
echo "If still having issues, check PM2 logs:"
echo "   pm2 logs sm-admin-wa-dashboard"