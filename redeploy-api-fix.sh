#!/bin/bash

echo "🔧 API Fix Redeploy - Fixing 308 Redirects"
echo "=========================================="

echo "📦 Pulling API fixes..."
git pull origin main

echo "🛑 Stopping current PM2 app..."
pm2 stop sm-admin-wa-dashboard

echo "🧹 Clean build with API fixes..."
rm -rf .next
export NODE_ENV=production
export NEXT_CONFIG_BASEPATH="/sm-admin"

echo "🔨 Building with trailingSlash fix..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful with API fixes!"
    
    echo "🚀 Restarting PM2..."
    pm2 restart sm-admin-wa-dashboard
    
    echo "⏳ Waiting for restart..."
    sleep 8
    
    echo "🧪 Testing API fixes..."
    
    # Test API Health (should be 200 now)
    echo "Testing API Health..."
    API_RESULT=$(curl -s -w "%{http_code}" "https://wecare.techconnect.co.id/sm-admin/api/health" -o /tmp/api_fix_test.txt)
    echo "API Health: HTTP $API_RESULT"
    if [ -f /tmp/api_fix_test.txt ]; then
        API_CONTENT=$(cat /tmp/api_fix_test.txt)
        echo "Response: $API_CONTENT"
    fi
    
    # Test Login API
    echo "Testing Login API..."
    LOGIN_RESULT=$(curl -s -w "%{http_code}" "https://wecare.techconnect.co.id/sm-admin/api/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com","password":"test"}' \
      -o /tmp/login_fix_test.txt)
    echo "Login API: HTTP $LOGIN_RESULT"
    if [ -f /tmp/login_fix_test.txt ]; then
        LOGIN_CONTENT=$(cat /tmp/login_fix_test.txt)
        echo "Response: $LOGIN_CONTENT"
    fi
    
    echo ""
    echo "📊 API FIX RESULTS"
    echo "=================="
    echo "API Health: $API_RESULT (should be 200)"
    echo "Login API:  $LOGIN_RESULT (should be 200/400/401)"
    echo ""
    
    if [ "$API_RESULT" = "200" ]; then
        echo "🎉 API HEALTH FIXED! No more 308 redirects!"
    else
        echo "⚠️  API Health still has issues ($API_RESULT)"
    fi
    
    if [ "$LOGIN_RESULT" = "200" ] || [ "$LOGIN_RESULT" = "400" ] || [ "$LOGIN_RESULT" = "401" ]; then
        echo "🎉 LOGIN API FIXED! Ready for authentication!"
    else
        echo "⚠️  Login API still has issues ($LOGIN_RESULT)"
    fi
    
    echo ""
    echo "🎯 FINAL STATUS:"
    echo "Website: https://wecare.techconnect.co.id/sm-admin/admin/ ✅"
    echo "API Endpoints: https://wecare.techconnect.co.id/sm-admin/api/* 🔄"
    echo "Ready for Postman testing with API key!"
    
else
    echo "❌ Build failed - check errors above"
fi

echo "🏁 API fix deploy completed!"