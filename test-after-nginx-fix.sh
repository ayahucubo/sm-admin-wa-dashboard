#!/bin/bash

echo "🧪 Testing After Nginx Fix - basePath Routing"
echo "============================================="

echo "🔍 Testing all endpoints after nginx configuration fix..."
echo ""

# Test API Health
echo "1️⃣ Testing API Health Endpoint"
echo "URL: https://wecare.techconnect.co.id/sm-admin/api/health"
API_RESULT=$(curl -s -w "%{http_code}" "https://wecare.techconnect.co.id/sm-admin/api/health" -o /tmp/api_result.txt)
echo "Result: HTTP $API_RESULT"
if [ -f /tmp/api_result.txt ]; then
    API_CONTENT=$(cat /tmp/api_result.txt)
    echo "Content: $API_CONTENT"
    if [[ "$API_CONTENT" == *'"status"'* ]]; then
        echo "✅ API returning JSON - SUCCESS!"
    else
        echo "❌ API returning HTML - Still has issues"
    fi
fi
echo ""

# Test Admin Dashboard
echo "2️⃣ Testing Admin Dashboard" 
echo "URL: https://wecare.techconnect.co.id/sm-admin/admin/"
ADMIN_RESULT=$(curl -s -w "%{http_code}" "https://wecare.techconnect.co.id/sm-admin/admin/" -o /tmp/admin_result.txt)
echo "Result: HTTP $ADMIN_RESULT"
if [ -f /tmp/admin_result.txt ]; then
    ADMIN_CONTENT=$(head -5 /tmp/admin_result.txt | tr '\n' ' ')
    echo "Content preview: $ADMIN_CONTENT..."
    if [[ "$ADMIN_CONTENT" == *'<!DOCTYPE html>'* ]]; then
        echo "✅ Admin page returning HTML - SUCCESS!"
    else
        echo "❌ Admin page has issues"
    fi
fi
echo ""

# Test Static CSS Assets
echo "3️⃣ Testing CSS Assets"
echo "URL: https://wecare.techconnect.co.id/sm-admin/_next/static/css/860f0669d6b51cc4.css"
CSS_RESULT=$(curl -s -w "%{http_code}" "https://wecare.techconnect.co.id/sm-admin/_next/static/css/860f0669d6b51cc4.css" -o /tmp/css_result.txt)
echo "Result: HTTP $CSS_RESULT"
if [ "$CSS_RESULT" = "200" ]; then
    echo "✅ CSS Assets loading - SUCCESS!"
else
    echo "❌ CSS Assets still failing"
fi
echo ""

# Test Login API
echo "4️⃣ Testing Login API Endpoint"
echo "URL: https://wecare.techconnect.co.id/sm-admin/api/login"
LOGIN_RESULT=$(curl -s -w "%{http_code}" "https://wecare.techconnect.co.id/sm-admin/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -o /tmp/login_result.txt)
echo "Result: HTTP $LOGIN_RESULT"
if [ -f /tmp/login_result.txt ]; then
    LOGIN_CONTENT=$(cat /tmp/login_result.txt)
    echo "Content: $LOGIN_CONTENT"
    if [[ "$LOGIN_CONTENT" == *'"success"'* ]] || [[ "$LOGIN_CONTENT" == *'"error"'* ]]; then
        echo "✅ Login API returning JSON - SUCCESS!"
    else
        echo "❌ Login API returning HTML - Still has issues"
    fi
fi
echo ""

# Summary
echo "📊 FINAL SUMMARY"
echo "================"
echo "API Health: $API_RESULT"
echo "Admin Page: $ADMIN_RESULT"
echo "CSS Assets: $CSS_RESULT"
echo "Login API:  $LOGIN_RESULT"
echo ""

# Success check
SUCCESS_COUNT=0
if [ "$API_RESULT" = "200" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
fi
if [ "$ADMIN_RESULT" = "200" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
fi
if [ "$CSS_RESULT" = "200" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
fi
if [ "$LOGIN_RESULT" = "200" ] || [ "$LOGIN_RESULT" = "400" ] || [ "$LOGIN_RESULT" = "401" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
fi

if [ $SUCCESS_COUNT -eq 4 ]; then
    echo "🎉 COMPLETE SUCCESS! All endpoints working!"
    echo "✅ Website: https://wecare.techconnect.co.id/sm-admin/admin/"
    echo "✅ API: https://wecare.techconnect.co.id/sm-admin/api/"
    echo "✅ Ready for production use with Postman!"
    echo ""
    echo "🔑 For API access, use header:"
    echo "   X-API-Key: smm-prod-55b612d24a000915f3500ea652b75c14"
elif [ $SUCCESS_COUNT -ge 2 ]; then
    echo "⚠️  Partial Success ($SUCCESS_COUNT/4 working)"
    echo "Some endpoints working, others may need additional fixes"
else
    echo "❌ Major Issues ($SUCCESS_COUNT/4 working)"
    echo "Need to investigate further"
fi

echo ""
echo "🏁 Test completed!"