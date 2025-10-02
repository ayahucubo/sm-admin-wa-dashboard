#!/bin/bash

echo "🔧 FIXING API ENDPOINT REDIRECTS"
echo "================================"

echo "1️⃣ Testing the specific failing endpoint..."
echo "Direct test:"
curl -v http://localhost:3001/sm-admin/api/monitoring/unique-contacts 2>&1 | head -10

echo ""
echo "With trailing slash:"
curl -v http://localhost:3001/sm-admin/api/monitoring/unique-contacts/ 2>&1 | head -10

echo ""
echo "2️⃣ Testing with proper headers..."
echo "Testing with Accept: application/json header:"
curl -H "Accept: application/json" -s http://localhost:3001/sm-admin/api/monitoring/unique-contacts?days=7 | head -5

echo ""
echo "3️⃣ Quick fix - rebuild and restart..."
echo "Building application..."
cd /var/www/sm-admin-wa-new
npm run build

echo ""
echo "Restarting PM2..."
pm2 restart sm-admin-wa-dashboard

echo ""
echo "4️⃣ Testing after restart..."
sleep 3
echo "Testing unique contacts API:"
curl -H "Accept: application/json" -s "http://localhost:3001/sm-admin/api/monitoring/unique-contacts?days=7" | head -3

echo ""
echo "Testing via nginx:"
curl -H "Accept: application/json" -s "http://wecare.techconnect.co.id/sm-admin/api/monitoring/unique-contacts?days=7" | head -3

echo ""
echo "✅ API Fix Complete!"
echo "If still having issues, check PM2 logs: pm2 logs sm-admin-wa-dashboard"