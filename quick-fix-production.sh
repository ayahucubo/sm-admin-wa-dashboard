#!/bin/bash
# Quick Production Fix Script

set -e

echo "🔧 Quick Production Fix for SM Admin WA Dashboard"
echo "================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

echo "📦 Building the application..."
npm run build

echo "🧪 Testing API endpoints locally first..."
# Quick test to make sure everything compiles
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo "🚀 Starting production server..."
echo "🌐 Server will be available at: http://localhost:3001"
echo "🔗 With basePath, access at: http://localhost:3001/sm-admin/admin/"
echo ""
echo "🔧 Debug URLs to test:"
echo "   - API Stats: http://localhost:3001/sm-admin/api/monitoring/chat-stats"
echo "   - API History: http://localhost:3001/sm-admin/api/chat/history-filtered"
echo ""
echo "📝 If still failing, check server logs for:"
echo "   - 💻 Chat statistics API called"
echo "   - 💬 Chat history API called"
echo "   - Database connection errors"
echo ""

NODE_ENV=production npm start