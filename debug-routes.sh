#!/bin/bash
# Debug script to test all routes and diagnose 404 issues

echo "🔍 SM Admin WA Dashboard - Route Testing"
echo "======================================="

BASE_URL="https://wecare.techconnect.co.id/sm-admin"

echo "Testing routes..."

# Test root paths
echo ""
echo "📍 Root Paths:"
curl -sI "$BASE_URL" | head -1
curl -sI "$BASE_URL/" | head -1

# Test main app routes
echo ""
echo "📍 Main App Routes:"
curl -sI "$BASE_URL/login" | head -1
curl -sI "$BASE_URL/admin" | head -1
curl -sI "$BASE_URL/dashboard" | head -1

# Test API routes
echo ""
echo "📍 API Routes:"
curl -sI "$BASE_URL/api/health" | head -1
curl -sI "$BASE_URL/api/debug" | head -1

# Test local application directly (bypass nginx)
echo ""
echo "📍 Local Direct Access (Port 3001):"
curl -sI "http://localhost:3001/login" | head -1
curl -sI "http://localhost:3001/admin" | head -1
curl -sI "http://localhost:3001/api/health" | head -1

# Check PM2 logs for errors
echo ""
echo "📍 Recent PM2 Logs:"
pm2 logs --lines 5 --nostream

echo ""
echo "📍 Current PM2 Status:"
pm2 status