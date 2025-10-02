#!/bin/bash

echo "🔍 NGINX AND ROUTING DIAGNOSIS"
echo "============================="

echo "1️⃣ Checking nginx configuration..."
echo "Looking for sm-admin configuration:"
sudo grep -r "sm-admin" /etc/nginx/ 2>/dev/null || echo "No sm-admin config found in nginx"

echo ""
echo "2️⃣ Testing backend directly..."
echo "Local backend test:"
curl -s -I http://localhost:3001/sm-admin/admin/ | head -3

echo ""
echo "3️⃣ Testing through nginx..."
echo "External request test:"
curl -s -I https://wecare.techconnect.co.id/sm-admin/admin/ | head -3

echo ""
echo "4️⃣ Checking nginx error logs..."
echo "Recent nginx errors:"
sudo tail -n 10 /var/log/nginx/error.log 2>/dev/null || echo "No nginx error log accessible"

echo ""
echo "5️⃣ Checking nginx access logs..."
echo "Recent nginx access for sm-admin:"
sudo tail -n 20 /var/log/nginx/access.log 2>/dev/null | grep "sm-admin" || echo "No sm-admin requests in access log"

echo ""
echo "6️⃣ PM2 status check..."
pm2 list

echo ""
echo "7️⃣ Port check..."
echo "Checking what's running on port 3001:"
sudo netstat -tlnp | grep :3001

echo ""
echo "8️⃣ Testing specific routes..."
echo "Testing /sm-admin/ (root):"
curl -s http://localhost:3001/sm-admin/ | head -1

echo ""
echo "Testing /sm-admin/admin/ (admin page):"
curl -s http://localhost:3001/sm-admin/admin/ | head -1