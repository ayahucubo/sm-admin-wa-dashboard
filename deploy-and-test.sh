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

# Restart PM2 services
echo "🔄 Restarting services..."
pm2 restart all

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 5

# Test critical endpoints
echo "🧪 Testing API endpoints..."
API_KEY="smm-prod-55b612d24a000915f3500ea652b75c14"
BASE_URL="https://wecare.techconnect.co.id"

echo ""
echo "Testing new diagnostic endpoint..."
curl -s "$BASE_URL/api/diagnostic" | jq . || echo "❌ Diagnostic failed"

echo ""
echo "Testing basic health..."
curl -s "$BASE_URL/api/health" -H "X-API-Key: $API_KEY" | jq . || echo "❌ Health failed"

echo ""
echo "Testing V1 health..."
curl -s "$BASE_URL/api/v1/health" -H "X-API-Key: $API_KEY" | jq . || echo "❌ V1 Health failed"

echo ""
echo "Testing V1 info..."
curl -s -m 10 "$BASE_URL/api/v1" -H "X-API-Key: $API_KEY" | jq . || echo "❌ V1 Info failed or timeout"

echo ""
echo "Testing chat endpoints..."
curl -s -m 10 "$BASE_URL/api/v1/chat?limit=1" -H "X-API-Key: $API_KEY" | jq . || echo "❌ Chat failed"

echo ""
echo "🏁 Deployment and testing completed!"
echo "Check the results above for any ❌ failures"