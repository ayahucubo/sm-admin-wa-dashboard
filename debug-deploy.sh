#!/bin/bash

echo "🔍 SM Admin Debug Deployment"
echo "================================"

# Clean build first
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build with debug info
echo "🔨 Building with debug..."
NODE_ENV=production npm run build

# Check if build files exist
echo "📁 Checking build output..."
ls -la .next/
echo ""
ls -la .next/static/
echo ""

# Start application in background
echo "🚀 Starting application..."
NODE_ENV=production PORT=3001 npm start &
APP_PID=$!

# Wait for app to start
echo "⏳ Waiting for application to start..."
sleep 10

# Test direct localhost access (bypass nginx)
echo "🧪 Testing direct localhost access..."
echo ""
echo "Testing localhost:3001/api/health (direct Next.js)"
curl -s -w "HTTP_CODE:%{http_code}\n" "http://localhost:3001/api/health"
echo ""

echo "Testing localhost:3001/sm-admin/api/health (with basePath)"
curl -s -w "HTTP_CODE:%{http_code}\n" "http://localhost:3001/sm-admin/api/health"
echo ""

echo "Testing localhost:3001/admin/ (direct admin page)"
curl -s -w "HTTP_CODE:%{http_code}\n" "http://localhost:3001/admin/" | head -10
echo ""

echo "Testing localhost:3001/sm-admin/admin/ (with basePath)"
curl -s -w "HTTP_CODE:%{http_code}\n" "http://localhost:3001/sm-admin/admin/" | head -10
echo ""

# Clean up
echo "🛑 Stopping test application..."
kill $APP_PID

echo "🏁 Debug completed!"