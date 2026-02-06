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

# Test critical endpoints with N8N authentication integration
echo "🧪 Testing API endpoints with N8N authentication..."
API_KEY="smm-prod-55b612d24a000915f3500ea652b75c14"
BASE_URL="https://wecare.techconnect.co.id"

echo ""
echo "🔐 Testing N8N integrated login..."
echo "Using N8N webhook: https://wecare.techconnect.co.id/webhook/100/app/api/login"
echo "Testing with benefitadmin credentials..."

# Test login with N8N integration
LOGIN_RESPONSE=$(curl -s -L -w "HTTP_CODE:%{http_code}" "$BASE_URL/sm-admin/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"benefitadmin@sinarmasmining.com","password":"bnft_1209"}')

LOGIN_HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$LOGIN_HTTP_CODE" = "200" ] && echo "$LOGIN_BODY" | grep -q '"success":true'; then
    echo "✅ N8N Login working (HTTP $LOGIN_HTTP_CODE)"
    # Extract token for authenticated requests
    ADMIN_TOKEN=$(echo "$LOGIN_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$ADMIN_TOKEN" ]; then
        echo "   Token received: ${ADMIN_TOKEN:0:20}..."
        AUTH_HEADER="Authorization: Bearer $ADMIN_TOKEN"
    else
        echo "   ⚠️  No token in response, using API key fallback"
        AUTH_HEADER="X-API-Key: $API_KEY"
    fi
else
    echo "❌ N8N Login failed (HTTP $LOGIN_HTTP_CODE)"
    echo "   Response: $(echo "$LOGIN_BODY" | cut -c1-200)..."
    echo "   Using API key fallback for other tests"
    AUTH_HEADER="X-API-Key: $API_KEY"
fi

echo ""
echo "🔍 Testing nginx rewrite behavior..."
echo "Request: $BASE_URL/sm-admin/api/health"
echo "Expected: /sm-admin/api/health → rewrite to /api/health → proxy to localhost:3001/api/health"
echo ""

echo "Testing basic health (follow redirects)..."
HEALTH_RESPONSE=$(curl -s -L -w "HTTP_CODE:%{http_code}" "$BASE_URL/sm-admin/api/health/" -H "$AUTH_HEADER")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$HTTP_CODE" = "200" ] && echo "$RESPONSE_BODY" | grep -q '"status":"healthy"'; then
    echo "✅ Health endpoint working (HTTP $HTTP_CODE)"
    echo "   Response: $(echo "$RESPONSE_BODY" | cut -c1-150)..."
else
    echo "❌ Health endpoint failed (HTTP $HTTP_CODE)"
    echo "   Response: $(echo "$RESPONSE_BODY" | cut -c1-300)..."
fi

echo ""
echo "Testing V1 health (follow redirects)..."
V1_HEALTH_RESPONSE=$(curl -s -L -w "HTTP_CODE:%{http_code}" "$BASE_URL/sm-admin/api/v1/health/" -H "$AUTH_HEADER")
V1_HTTP_CODE=$(echo "$V1_HEALTH_RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
V1_RESPONSE_BODY=$(echo "$V1_HEALTH_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$V1_HTTP_CODE" = "200" ] && echo "$V1_RESPONSE_BODY" | grep -q '"status":"healthy"'; then
    echo "✅ V1 Health endpoint working (HTTP $V1_HTTP_CODE)"
else
    echo "❌ V1 Health endpoint failed (HTTP $V1_HTTP_CODE)"
    echo "   Response: $(echo "$V1_RESPONSE_BODY" | cut -c1-200)..."
fi

echo ""
echo "Testing V1 info with authentication..."
V1_INFO_RESPONSE=$(curl -s -L -w "HTTP_CODE:%{http_code}" -m 10 "$BASE_URL/sm-admin/api/v1/" -H "$AUTH_HEADER")
INFO_HTTP_CODE=$(echo "$V1_INFO_RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
INFO_RESPONSE_BODY=$(echo "$V1_INFO_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$INFO_HTTP_CODE" = "200" ] && echo "$INFO_RESPONSE_BODY" | grep -q '"success":true'; then
    echo "✅ V1 Info endpoint working with auth (HTTP $INFO_HTTP_CODE)"
    echo "   API Name: $(echo "$INFO_RESPONSE_BODY" | grep -o '"name":"[^"]*"' | head -1)"
else
    echo "❌ V1 Info endpoint failed (HTTP $INFO_HTTP_CODE)"
    echo "   Response: $(echo "$INFO_RESPONSE_BODY" | cut -c1-200)..."
fi

echo ""
echo "Testing diagnostic endpoint..."
DIAG_RESPONSE=$(curl -s -L -w "HTTP_CODE:%{http_code}" "$BASE_URL/sm-admin/api/diagnostic/")
DIAG_HTTP_CODE=$(echo "$DIAG_RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
DIAG_RESPONSE_BODY=$(echo "$DIAG_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$DIAG_HTTP_CODE" = "200" ] && echo "$DIAG_RESPONSE_BODY" | grep -q '"success":true'; then
    echo "✅ Diagnostic endpoint working (HTTP $DIAG_HTTP_CODE)"
else
    echo "❌ Diagnostic endpoint failed (HTTP $DIAG_HTTP_CODE)"
    echo "   Response: $(echo "$DIAG_RESPONSE_BODY" | cut -c1-200)..."
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