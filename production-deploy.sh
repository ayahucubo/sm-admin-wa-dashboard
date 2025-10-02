#!/bin/bash
# Production deployment script with proper log directory setup
# This script fixes the build and deployment issues

echo "🚀 SM Admin WA Dashboard - Production Fix Deployment"
echo "=================================================="

# 1. Navigate to project directory
cd /var/www/sm-admin-wa-new

# 2. Stop existing PM2 processes
echo "⏹️ Stopping existing PM2 processes..."
pm2 stop all 2>/dev/null || echo "No processes to stop"
pm2 delete all 2>/dev/null || echo "No processes to delete"

# 3. Create log directories with proper permissions
echo "📁 Creating log directories..."
sudo mkdir -p /var/www/logs
sudo chown $(whoami):$(whoami) /var/www/logs
sudo chmod 755 /var/www/logs

# 4. Clean and reinstall dependencies
echo "🧹 Cleaning previous installation..."
rm -rf node_modules package-lock.json .next

echo "📦 Installing all dependencies (including build tools)..."
npm install

# 5. Build the application
echo "🔨 Building application..."
NODE_ENV=production npm run build

# 6. Check if build was successful
if [ ! -d ".next" ]; then
    echo "❌ Build failed - .next directory not found"
    exit 1
fi

echo "✅ Build successful!"

# 7. Update PM2 ecosystem configuration
echo "⚙️ Updating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'sm-admin-wa-dashboard',
      script: './node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/sm-admin-wa-new',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/www/logs/sm-admin-error.log',
      out_file: '/var/www/logs/sm-admin-out.log',
      log_file: '/var/www/logs/sm-admin-combined.log',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
EOF

# 8. Start with PM2
echo "▶️ Starting application with PM2..."
pm2 start ecosystem.config.js

# 9. Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# 10. Test the application
echo "🔍 Testing application..."
sleep 10

# Test local health endpoint
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Local health check passed"
else
    echo "❌ Local health check failed - checking logs..."
    pm2 logs --lines 10
fi

# 11. Show current status
echo "📊 Current PM2 Status:"
pm2 status

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "🔍 To check logs:"
echo "   pm2 logs sm-admin-wa-dashboard"
echo ""
echo "🌐 Test the application:"
echo "   curl http://localhost:3001/api/health"
echo "   curl https://wecare.techconnect.co.id/sm-admin/api/health"
echo ""
echo "📱 Access the dashboard:"
echo "   https://wecare.techconnect.co.id/sm-admin/admin/"