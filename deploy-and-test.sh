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

# Test critical endpoints (nginx rewrite compatible)
echo "🧪 Testing API endpoints..."
API_KEY="smm-prod-55b612d24a000915f3500ea652b75c14"
BASE_URL="https://wecare.techconnect.co.id"

echo ""
echo "Testing basic health (via nginx /sm-admin/ rewrite)..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/sm-admin/api/health" -H "X-API-Key: $API_KEY")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ Health endpoint working via nginx"
else
    echo "❌ Health endpoint failed: $HEALTH_RESPONSE"
    # Try with trailing slash (nginx behavior)
    HEALTH_RESPONSE_SLASH=$(curl -s "$BASE_URL/sm-admin/api/health/" -H "X-API-Key: $API_KEY")
    if echo "$HEALTH_RESPONSE_SLASH" | grep -q '"status":"healthy"'; then
        echo "✅ Health endpoint working with trailing slash"
    else
        echo "❌ Health endpoint with slash also failed: $HEALTH_RESPONSE_SLASH"
    fi
fi

echo ""
echo "Testing V1 health (via nginx /sm-admin/ rewrite)..."
V1_HEALTH_RESPONSE=$(curl -s "$BASE_URL/sm-admin/api/v1/health" -H "X-API-Key: $API_KEY")
if echo "$V1_HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ V1 Health endpoint working via nginx"
else
    echo "❌ V1 Health endpoint failed: $V1_HEALTH_RESPONSE"
    # Try with trailing slash
    V1_HEALTH_RESPONSE_SLASH=$(curl -s "$BASE_URL/sm-admin/api/v1/health/" -H "X-API-Key: $API_KEY")
    if echo "$V1_HEALTH_RESPONSE_SLASH" | grep -q '"status":"healthy"'; then
        echo "✅ V1 Health endpoint working with trailing slash"
    fi
fi

echo ""
echo "Testing V1 info (via nginx /sm-admin/ rewrite)..."
V1_INFO_RESPONSE=$(curl -s -m 10 "$BASE_URL/sm-admin/api/v1" -H "X-API-Key: $API_KEY")
if echo "$V1_INFO_RESPONSE" | grep -q '"success":true'; then
    echo "✅ V1 Info endpoint working via nginx"
    echo "   Response preview: $(echo "$V1_INFO_RESPONSE" | cut -c1-100)..."
else
    echo "❌ V1 Info endpoint failed: $V1_INFO_RESPONSE"
    # Try with trailing slash
    V1_INFO_RESPONSE_SLASH=$(curl -s -m 10 "$BASE_URL/sm-admin/api/v1/" -H "X-API-Key: $API_KEY")
    if echo "$V1_INFO_RESPONSE_SLASH" | grep -q '"success":true'; then
        echo "✅ V1 Info endpoint working with trailing slash"
        echo "   Response preview: $(echo "$V1_INFO_RESPONSE_SLASH" | cut -c1-100)..."
    fi
fi

echo ""
echo "Testing diagnostic endpoint (via nginx /sm-admin/ rewrite)..."
DIAG_RESPONSE=$(curl -s "$BASE_URL/sm-admin/api/diagnostic")
if echo "$DIAG_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Diagnostic endpoint working via nginx"
else
    echo "❌ Diagnostic endpoint failed: $DIAG_RESPONSE"
    # Try with trailing slash
    DIAG_RESPONSE_SLASH=$(curl -s "$BASE_URL/sm-admin/api/diagnostic/")
    if echo "$DIAG_RESPONSE_SLASH" | grep -q '"success":true'; then
        echo "✅ Diagnostic endpoint working with trailing slash"
    fi
fi

echo ""
echo "Testing chat endpoints (via nginx /sm-admin/ rewrite)..."
CHAT_RESPONSE=$(curl -s -m 10 "$BASE_URL/sm-admin/api/v1/chat?limit=1" -H "X-API-Key: $API_KEY")
if echo "$CHAT_RESPONSE" | grep -q '"success"'; then
    echo "✅ Chat endpoint working via nginx"
else
    echo "⚠️  Chat endpoint response: $CHAT_RESPONSE"
fi

echo ""
echo "🏁 Deployment and testing completed!"
echo "Summary:"
echo "- Check above for ✅ (working) or ❌ (failed) status"
echo "- If V1 endpoints are working, API is functional"
echo "- Chat endpoints may need additional setup"