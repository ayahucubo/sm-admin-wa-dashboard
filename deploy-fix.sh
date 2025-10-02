#!/bin/bash
# Deployment Script untuk SM Admin WA Dashboard
# Jalankan script ini di server setelah melakukan git pull

echo "🚀 Starting SM Admin WA Dashboard deployment..."

# 1. Navigate to project directory
cd /var/www/sm-admin-wa-new

# 2. Stop existing PM2 process
echo "⏹️ Stopping existing PM2 process..."
pm2 stop sm-admin-wa-dashboard 2>/dev/null || echo "No existing process found"

# 3. Install/update dependencies
echo "📦 Installing dependencies..."
npm ci

# 4. Build the application
echo "🔨 Building application..."
npm run build

# 5. Start with PM2
echo "▶️ Starting application with PM2..."
pm2 start ecosystem.config.js

# 6. Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# 7. Test the application
echo "🔍 Testing application health..."
sleep 5
curl -f http://localhost:3001/api/health || echo "⚠️ Health check failed - check logs"

# 8. Show PM2 status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Deployment completed!"
echo ""
echo "🔧 Next steps:"
echo "1. Update nginx configuration:"
echo "   sudo cp nginx-config-fix.conf /etc/nginx/sites-available/wecare.techconnect.co.id"
echo "   sudo nginx -t"
echo "   sudo systemctl restart nginx"
echo ""
echo "2. Check logs if needed:"
echo "   pm2 logs sm-admin-wa-dashboard"
echo ""
echo "3. Test the application:"
echo "   curl https://wecare.techconnect.co.id/sm-admin/api/health"
echo ""
echo "4. Access the dashboard:"
echo "   https://wecare.techconnect.co.id/sm-admin/admin/"