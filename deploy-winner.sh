#!/bin/bash

echo "🏆 SM Admin - Deploy Strategy A (basePath Winner)"
echo "================================================"

# Kill any existing processes on port 3001
echo "🛑 Stopping all port 3001 processes..."
sudo lsof -ti:3001 | sudo xargs kill -9 2>/dev/null || true
sleep 2

# Clean PM2 processes
echo "🧹 Cleaning PM2 processes..."
pm2 stop sm-admin-wa-dashboard 2>/dev/null || true
pm2 delete sm-admin-wa-dashboard 2>/dev/null || true

# Clean build
echo "🧹 Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force

# Set basePath configuration (Strategy A winner)
export NODE_ENV=production
export NEXT_CONFIG_BASEPATH="/sm-admin"
export PORT=3001

echo "🔨 Building with basePath /sm-admin (winner strategy)..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "🚀 Starting with PM2..."
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'sm-admin-wa-dashboard',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      NEXT_CONFIG_BASEPATH: '/sm-admin',
      PORT: 3001
    }
  }]
};
EOF

    # Start with PM2
    pm2 start ecosystem.config.js --env production
    
    echo "⏳ Waiting for application startup..."
    sleep 10
    
    echo "🧪 Testing deployment..."
    
    # Test API (should work via nginx now)
    echo "Testing API via nginx: /sm-admin/api/health"
    API_TEST=$(curl -s -w "%{http_code}" "https://wecare.techconnect.co.id/sm-admin/api/health" -o /tmp/api_test.txt)
    echo "API Result: HTTP $API_TEST"
    if [ -f /tmp/api_test.txt ]; then
        echo "API Response: $(cat /tmp/api_test.txt)"
    fi
    
    # Test Admin Page
    echo "Testing Admin Page: /sm-admin/admin/"
    ADMIN_TEST=$(curl -s -w "%{http_code}" "https://wecare.techconnect.co.id/sm-admin/admin/" -o /tmp/admin_test.txt)
    echo "Admin Result: HTTP $ADMIN_TEST"
    
    # Test CSS Assets
    echo "Testing CSS Assets: /sm-admin/_next/static/css/..."
    CSS_TEST=$(curl -s -w "%{http_code}" "https://wecare.techconnect.co.id/sm-admin/_next/static/css/860f0669d6b51cc4.css" -o /tmp/css_test.txt)
    echo "CSS Result: HTTP $CSS_TEST"
    
    echo ""
    echo "🎯 DEPLOYMENT SUMMARY"
    echo "===================="
    echo "API Health: $API_TEST"
    echo "Admin Page: $ADMIN_TEST"  
    echo "CSS Assets: $CSS_TEST"
    echo ""
    
    if [ "$API_TEST" = "200" ] && [ "$ADMIN_TEST" = "200" ] && [ "$CSS_TEST" = "200" ]; then
        echo "🎉 SUCCESS! All endpoints working!"
        echo "✅ Website: https://wecare.techconnect.co.id/sm-admin/admin/"
        echo "✅ API: https://wecare.techconnect.co.id/sm-admin/api/health"
        echo "✅ Ready for Postman testing with API key!"
    else
        echo "⚠️  Partial success - some endpoints need attention"
        echo "Check nginx configuration and application logs"
    fi
    
    echo ""
    echo "📋 PM2 Status:"
    pm2 status
    
else
    echo "❌ Build failed!"
    echo "Check build errors above"
fi

echo "🏁 Deployment completed!"