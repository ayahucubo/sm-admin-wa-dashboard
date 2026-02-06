#!/bin/bash
# Production Deployment and Testing Script

echo "🚀 SM Admin API - Production Deployment & Testing"
echo "================================================="

# Pull latest changes
echo "📦 Pulling latest changes..."
git pull origin main

# Install dependencies (if needed)
if [ -f "package.json" ]; then 
    echo "📋 Installing dependencies..."
    npm install --production
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi

# Restart PM2 services
echo "🔄 Restarting services..."
pm2 restart all

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 5

# Test critical endpoints (without jq dependency)
echo "🧪 Testing API endpoints..."
API_KEY="smm-prod-55b612d24a000915f3500ea652b75c14"
BASE_URL="https://wecare.techconnect.co.id"
API_BASE="$BASE_URL/sm-admin"

echo ""
echo "Testing basic health (direct)..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health" -H "X-API-Key: $API_KEY")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ Health endpoint working (direct)"
else
    echo "❌ Health endpoint failed (direct): $HEALTH_RESPONSE"
fi

echo ""
echo "Testing basic health (basePath)..."
HEALTH_BP_RESPONSE=$(curl -s "$API_BASE/api/health" -H "X-API-Key: $API_KEY")
if echo "$HEALTH_BP_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ Health endpoint working (basePath)"
else
    echo "❌ Health endpoint failed (basePath): $HEALTH_BP_RESPONSE"
fi

echo ""
echo "Testing V1 health (direct)..."
V1_HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/v1/health" -H "X-API-Key: $API_KEY")
if echo "$V1_HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ V1 Health endpoint working (direct)"
else
    echo "❌ V1 Health endpoint failed (direct): $V1_HEALTH_RESPONSE"
fi

echo ""
echo "Testing V1 health (basePath)..."
V1_HEALTH_BP_RESPONSE=$(curl -s "$API_BASE/api/v1/health" -H "X-API-Key: $API_KEY")
if echo "$V1_HEALTH_BP_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ V1 Health endpoint working (basePath)"
else
    echo "❌ V1 Health endpoint failed (basePath): $V1_HEALTH_BP_RESPONSE"
fi

echo ""
echo "Testing V1 info (direct)..."
V1_INFO_RESPONSE=$(curl -s -m 10 "$BASE_URL/api/v1" -H "X-API-Key: $API_KEY")
if echo "$V1_INFO_RESPONSE" | grep -q '"success":true'; then
    echo "✅ V1 Info endpoint working (direct)"
    echo "   Response preview: $(echo "$V1_INFO_RESPONSE" | cut -c1-100)..."
else
    echo "❌ V1 Info endpoint failed (direct): $V1_INFO_RESPONSE"
fi

echo ""
echo "Testing V1 info (basePath)..."
V1_INFO_BP_RESPONSE=$(curl -s -m 10 "$API_BASE/api/v1" -H "X-API-Key: $API_KEY")
if echo "$V1_INFO_BP_RESPONSE" | grep -q '"success":true'; then
    echo "✅ V1 Info endpoint working (basePath)"
    echo "   Response preview: $(echo "$V1_INFO_BP_RESPONSE" | cut -c1-100)..."
else
    echo "❌ V1 Info endpoint failed (basePath): $V1_INFO_BP_RESPONSE"
fi

echo ""
echo "Testing chat endpoints..."
CHAT_RESPONSE=$(curl -s -m 10 "$BASE_URL/api/v1/chat?limit=1" -H "X-API-Key: $API_KEY")
if echo "$CHAT_RESPONSE" | grep -q '"success"'; then
    echo "✅ Chat endpoint working (direct)"
else
    echo "⚠️  Chat endpoint response (direct): $CHAT_RESPONSE"
fi

echo ""
echo "Testing chat endpoints (basePath)..."
CHAT_BP_RESPONSE=$(curl -s -m 10 "$API_BASE/api/v1/chat?limit=1" -H "X-API-Key: $API_KEY")
if echo "$CHAT_BP_RESPONSE" | grep -q '"success"'; then
    echo "✅ Chat endpoint working (basePath)"
else
    echo "⚠️  Chat endpoint response (basePath): $CHAT_BP_RESPONSE"
fi

echo ""
echo "🏁 Deployment and testing completed!"
echo "Summary:"
echo "- Check above for ✅ (working) or ❌ (failed) status"
echo "- If V1 endpoints are working, API is functional"
echo "- Chat endpoints may need additional setup"