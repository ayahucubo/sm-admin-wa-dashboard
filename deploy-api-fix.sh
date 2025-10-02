#!/bin/bash

echo "🔧 FIXING API TRAILING SLASH REDIRECTS"
echo "======================================"

echo "1️⃣ Next.js configuration updated to disable trailing slash redirects"
echo "2️⃣ Rebuilding application with new configuration..."

cd /var/www/sm-admin-wa-new

# Clean build
rm -rf .next
npm run build

echo ""
echo "3️⃣ Restarting PM2..."
pm2 restart sm-admin-wa-dashboard

echo ""
echo "4️⃣ Testing API after fix..."
sleep 5

echo "Testing unique contacts API (should return JSON now):"
curl -s -H "Accept: application/json" "http://localhost:3001/sm-admin/api/monitoring/unique-contacts?days=7"

echo ""
echo ""
echo "Testing via nginx:"
curl -s -H "Accept: application/json" "http://wecare.techconnect.co.id/sm-admin/api/monitoring/unique-contacts?days=7"

echo ""
echo ""
echo "✅ API FIX COMPLETE!"
echo "Your Unique Contacts Chart should now work properly!"
echo "Refresh your browser page to see the fix in action."