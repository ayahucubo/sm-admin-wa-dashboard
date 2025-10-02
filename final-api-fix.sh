#!/bin/bash

echo "🚀 FINAL API FIX DEPLOYMENT"
echo "==========================="

echo "1️⃣ Clean build with middleware fix..."
cd /var/www/sm-admin-wa-new
rm -rf .next
npm run build

echo ""
echo "2️⃣ Restart PM2..."
pm2 restart sm-admin-wa-dashboard

echo ""
echo "3️⃣ Test API endpoints..."
sleep 5

echo "Testing unique contacts API:"
curl -s -H "Accept: application/json" "http://localhost:3001/sm-admin/api/monitoring/unique-contacts?days=7" | head -3

echo ""
echo "4️⃣ Test via nginx:"
curl -s -H "Accept: application/json" "http://wecare.techconnect.co.id/sm-admin/api/monitoring/unique-contacts?days=7" | head -3

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "Hard refresh your browser (Ctrl+F5) to see the fix!"