#!/bin/bash

echo "🔍 SM Admin Production Fix - Two Strategy Test"
echo "============================================="

# Stop any running process first
echo "🛑 Stopping any background processes..."
pkill -f "npm start" || true
pkill -f "next start" || true

# Strategy A: Test with basePath (requires nginx without rewrite)
echo ""
echo "🧪 STRATEGY A: Testing with basePath /sm-admin"
echo "----------------------------------------------"

# Clean build first
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out

# Configure for basePath
export NODE_ENV=production
export NEXT_CONFIG_BASEPATH="/sm-admin"

echo "🔨 Building with basePath..."
npm run build

echo "🚀 Starting with basePath..."
NODE_ENV=production PORT=3001 npm start &
BASEPATH_PID=$!

# Wait for app to start
echo "⏳ Waiting for basePath app to start..."
sleep 8

echo "📋 Testing basePath approach..."
echo "Testing: localhost:3001/sm-admin/api/health"
BASEPATH_API=$(curl -s -w "%{http_code}" "http://localhost:3001/sm-admin/api/health" -o /tmp/basepath_api.txt)
echo "Result: HTTP $BASEPATH_API"
if [ -f /tmp/basepath_api.txt ]; then
    echo "Response: $(head -2 /tmp/basepath_api.txt)"
fi

echo "Testing: localhost:3001/sm-admin/_next/static/css/860f0669d6b51cc4.css"
BASEPATH_CSS=$(curl -s -w "%{http_code}" "http://localhost:3001/sm-admin/_next/static/css/860f0669d6b51cc4.css" -o /tmp/basepath_css.txt)
echo "Result: HTTP $BASEPATH_CSS"

echo "Testing: localhost:3001/sm-admin/admin/"
BASEPATH_ADMIN=$(curl -s -w "%{http_code}" "http://localhost:3001/sm-admin/admin/" -o /tmp/basepath_admin.txt)
echo "Result: HTTP $BASEPATH_ADMIN"

# Clean up basePath test
echo "🛑 Stopping basePath test..."
kill $BASEPATH_PID 2>/dev/null || true
sleep 3

echo ""
echo "🧪 STRATEGY B: Testing without basePath (nginx-compatible)"
echo "---------------------------------------------------------"

# Clean build for no basePath
echo "🧹 Re-cleaning builds..."
rm -rf .next
export NODE_ENV=production
unset NEXT_CONFIG_BASEPATH

echo "🔨 Building without basePath..."
npm run build

echo "🚀 Starting without basePath..."
NODE_ENV=production PORT=3001 npm start &
NOBASEPATH_PID=$!

# Wait for app to start
echo "⏳ Waiting for no-basePath app to start..."
sleep 8

echo "📋 Testing no-basePath approach..."
echo "Testing: localhost:3001/api/health"
NOBASEPATH_API=$(curl -s -w "%{http_code}" "http://localhost:3001/api/health" -o /tmp/nobasepath_api.txt)
echo "Result: HTTP $NOBASEPATH_API"
if [ -f /tmp/nobasepath_api.txt ]; then
    echo "Response: $(head -2 /tmp/nobasepath_api.txt)"
fi

echo "Testing: localhost:3001/_next/static/css/860f0669d6b51cc4.css"
NOBASEPATH_CSS=$(curl -s -w "%{http_code}" "http://localhost:3001/_next/static/css/860f0669d6b51cc4.css" -o /tmp/nobasepath_css.txt)
echo "Result: HTTP $NOBASEPATH_CSS"

echo "Testing: localhost:3001/admin/"
NOBASEPATH_ADMIN=$(curl -s -w "%{http_code}" "http://localhost:3001/admin/" -o /tmp/nobasepath_admin.txt)
echo "Result: HTTP $NOBASEPATH_ADMIN"

# Clean up
echo "🛑 Stopping no-basePath test..."
kill $NOBASEPATH_PID 2>/dev/null || true

echo ""
echo "📊 RESULTS SUMMARY"
echo "=================="
echo "Strategy A (basePath):"
echo "  API Health: $BASEPATH_API"
echo "  CSS Assets: $BASEPATH_CSS" 
echo "  Admin Page: $BASEPATH_ADMIN"
echo ""
echo "Strategy B (no basePath):"
echo "  API Health: $NOBASEPATH_API"
echo "  CSS Assets: $NOBASEPATH_CSS"
echo "  Admin Page: $NOBASEPATH_ADMIN"
echo ""
echo "✅ Strategy with 200 responses wins!"

# Determine winner and deploy
if [ "$NOBASEPATH_API" = "200" ] && [ "$NOBASEPATH_CSS" = "200" ] && [ "$NOBASEPATH_ADMIN" = "200" ]; then
    echo "🏆 Winner: Strategy B (no basePath) - nginx compatible"
    echo "🚀 Deploying no-basePath version with PM2..."
    unset NEXT_CONFIG_BASEPATH
    pm2 start npm --name "sm-admin-wa-dashboard" -- start
elif [ "$BASEPATH_API" = "200" ] && [ "$BASEPATH_CSS" = "200" ] && [ "$BASEPATH_ADMIN" = "200" ]; then
    echo "🏆 Winner: Strategy A (basePath) - requires nginx fix"
    echo "🚀 Deploying basePath version with PM2..."
    export NEXT_CONFIG_BASEPATH="/sm-admin"
    pm2 start npm --name "sm-admin-wa-dashboard" -- start
else
    echo "❌ Both strategies failed - needs investigation"
    echo "Check .next build output and dependencies"
fi

echo "🏁 Debug deployment completed!"