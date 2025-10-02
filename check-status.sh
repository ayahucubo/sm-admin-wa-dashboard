#!/bin/bash

echo "🔍 APPLICATION STATUS CHECK"
echo "=========================="

echo "1️⃣ PM2 Status:"
pm2 list

echo ""
echo "2️⃣ Port Status:"
echo "Port 3001: $(lsof -ti:3001 >/dev/null && echo 'In Use' || echo 'Free')"
echo "Port 3000: $(lsof -ti:3000 >/dev/null && echo 'In Use' || echo 'Free')"

echo ""
echo "3️⃣ Service Tests:"
echo "Health API:"
curl -s http://localhost:3001/api/health 2>/dev/null || echo "❌ Not responding"

echo ""
echo "Root page:"
curl -s -I http://localhost:3001 2>/dev/null | head -1 || echo "❌ Not responding"

echo ""
echo "4️⃣ Environment:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

echo ""
echo "5️⃣ Recent Logs:"
pm2 logs --lines 5