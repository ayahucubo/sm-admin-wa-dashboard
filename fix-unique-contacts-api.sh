#!/bin/bash

echo "🎯 TARGETED FIX FOR UNIQUE CONTACTS API"
echo "======================================"

echo "1️⃣ Testing the exact API call that's failing..."
curl -v -H "Accept: application/json" -H "Content-Type: application/json" "http://localhost:3001/sm-admin/api/monitoring/unique-contacts?days=7" 2>&1 | head -20

echo ""
echo "2️⃣ Checking if it's an authentication issue..."
# Test without authentication first
curl -s -H "Accept: application/json" "http://localhost:3001/sm-admin/api/monitoring/unique-contacts?days=7" | head -5

echo ""
echo "3️⃣ Testing with different parameters..."
curl -s -H "Accept: application/json" "http://localhost:3001/sm-admin/api/monitoring/unique-contacts" | head -5

echo ""
echo "4️⃣ Check PM2 logs for errors..."
pm2 logs sm-admin-wa-dashboard --lines 10 | grep -i "error\|unique\|contacts"

echo ""
echo "5️⃣ Testing direct endpoint without sm-admin prefix..."
curl -s -H "Accept: application/json" "http://localhost:3001/api/monitoring/unique-contacts?days=7" | head -5

echo ""
echo "6️⃣ Force restart and test again..."
pm2 restart sm-admin-wa-dashboard
sleep 5
echo "After restart:"
curl -s -H "Accept: application/json" "http://localhost:3001/sm-admin/api/monitoring/unique-contacts?days=30" | head -5

echo ""
echo "7️⃣ Final test via nginx..."
curl -s -H "Accept: application/json" "http://wecare.techconnect.co.id/sm-admin/api/monitoring/unique-contacts?days=30" | head -5

echo ""
echo "✅ If still showing redirects, the issue is with Next.js trailing slash handling"
echo "Try refreshing your browser page - the rebuild may have fixed it!"