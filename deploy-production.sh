#!/bin/bash

# Deploy to production with correct port configuration
echo "🚀 PRODUCTION DEPLOYMENT"
echo "======================="

# 1. Stop existing PM2 processes
echo "1️⃣ Stopping existing processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# 2. Clean port 3001
echo "2️⃣ Cleaning port 3001..."
sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || true

# 3. Ensure environment file exists
echo "3️⃣ Checking environment..."
if [ ! -f ".env.production" ]; then
    echo "⚠️ .env.production not found, creating minimal version..."
    cat > .env.production << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://n8nuser:password@localhost:5488/postgres
N8N_DATABASE_URL=postgresql://n8nuser:password@localhost:5488/n8ndb
EOF
fi

# 4. Build the application
echo "4️⃣ Building application..."
npm run build

# 5. Start with PM2
echo "5️⃣ Starting with PM2..."
pm2 start ecosystem.config.js

# 6. Wait and check status
echo "6️⃣ Checking deployment..."
sleep 5
pm2 list

# 7. Test the endpoints
echo "7️⃣ Testing deployment..."
echo "Health check:"
curl -s http://localhost:3001/api/health || echo "❌ Health check failed"
echo ""
echo "Root page:"
curl -s -I http://localhost:3001 | head -1 || echo "❌ Root page failed"

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://wecare.techconnect.co.id/sm-admin/"
echo ""
echo "📊 Monitor with:"
echo "  pm2 list"
echo "  pm2 logs"
echo "  pm2 monit"