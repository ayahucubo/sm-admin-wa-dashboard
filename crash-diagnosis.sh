#!/bin/bash
# Diagnostic script to find what's crashing the app

echo "🔍 CRASH DIAGNOSIS: Finding what's breaking the app"
echo "=================================================="

cd /var/www/sm-admin-wa-new

# 1. Check PM2 logs for crash details
echo "📜 Recent PM2 Error Logs:"
pm2 logs --err --lines 20

echo ""
echo "📜 Recent PM2 Output Logs:"
pm2 logs --out --lines 20

# 2. Try to start manually to see error
echo ""
echo "🧪 Manual start test:"
pm2 stop all

# Start manually and capture error
echo "Starting manually..."
NODE_ENV=production PORT=3001 npm start 2>&1 &
MANUAL_PID=$!

sleep 15

# Check if process is running
if ps -p $MANUAL_PID > /dev/null; then
    echo "✅ Manual start successful"
    
    # Test endpoints
    echo "Testing endpoints:"
    curl -sI http://localhost:3001/ | head -1
    curl -sI http://localhost:3001/api/health | head -1
    
    # Kill manual process
    kill $MANUAL_PID
else
    echo "❌ Manual start failed"
fi

# 3. Check environment file
echo ""
echo "📋 Environment check:"
if [ -f .env.production ]; then
    echo "✅ .env.production exists"
    echo "Key variables present:"
    grep -E "^(PORT|NODE_ENV|DB_)" .env.production | head -5
else
    echo "❌ .env.production missing"
fi

# 4. Check if all required files exist
echo ""
echo "📁 File structure check:"
echo "package.json: $([ -f package.json ] && echo "✅" || echo "❌")"
echo "next.config.ts: $([ -f next.config.ts ] && echo "✅" || echo "❌")"
echo "src/app/page.tsx: $([ -f src/app/page.tsx ] && echo "✅" || echo "❌")"
echo ".next/: $([ -d .next ] && echo "✅" || echo "❌")"

# 5. Try with minimal environment
echo ""
echo "🔬 Testing with minimal environment:"
NODE_ENV=production PORT=3001 timeout 10s npm start 2>&1 | head -10 || echo "Startup failed"

echo ""
echo "💡 Next steps based on results:"
echo "- If manual start works: PM2 configuration issue"
echo "- If manual start fails: Application configuration issue"
echo "- Check error logs above for specific error messages"