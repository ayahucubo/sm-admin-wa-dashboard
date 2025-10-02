#!/bin/bash

echo "🔍 DIAGNOSING API ENDPOINT ISSUES"
echo "================================="

echo "1️⃣ Testing all API endpoints..."

echo "Health API:"
curl -s http://localhost:3001/sm-admin/api/health | head -1

echo ""
echo "Menu Master API:"
curl -s http://localhost:3001/sm-admin/api/menu-master | head -1

echo ""
echo "Knowledge Benefit API:"
curl -s http://localhost:3001/sm-admin/api/knowledge-benefit | head -1

echo ""
echo "CC Benefit Mapping API:"
curl -s http://localhost:3001/sm-admin/api/cc-benefit-mapping | head -1

echo ""
echo "CC PP Mapping API:"
curl -s http://localhost:3001/sm-admin/api/cc-pp-mapping | head -1

echo ""
echo "Monitoring APIs:"
echo "Chat History:"
curl -s http://localhost:3001/sm-admin/api/monitoring/chat-history | head -1

echo ""
echo "Chat Stats:"
curl -s http://localhost:3001/sm-admin/api/monitoring/chat-stats | head -1

echo ""
echo "Unique Contacts (the failing one):"
curl -s http://localhost:3001/sm-admin/api/monitoring/unique-contacts | head -1

echo ""
echo "Test API:"
curl -s http://localhost:3001/sm-admin/api/test | head -1

echo ""
echo "2️⃣ Testing through nginx (external)..."
echo "Unique Contacts via nginx:"
curl -s http://wecare.techconnect.co.id/sm-admin/api/monitoring/unique-contacts | head -1

echo ""
echo "Health API via nginx:"
curl -s http://wecare.techconnect.co.id/sm-admin/api/health | head -1

echo ""
echo "3️⃣ Checking browser network requests..."
echo "Open browser developer tools and check the Network tab for failed requests"
echo "Look for any API calls returning HTML instead of JSON"