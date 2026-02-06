#!/bin/bash

# Test All APIs with Correct Pattern (Trailing Slash)
BASE_URL="https://wecare.techconnect.co.id/sm-admin/api"
API_KEY="sm2024_admin_api_key_secure_access"

echo "========================================"
echo "COMPREHENSIVE API TEST - CORRECT PATTERN"
echo "Base URL: $BASE_URL"
echo "Pattern: {endpoint}/ (with trailing slash)"
echo "========================================"

test_endpoint() {
  local endpoint="$1"
  local method="${2:-GET}"
  local data="$3"
  
  echo ""
  echo "Testing: $method $endpoint"
  echo "URL: $BASE_URL/$endpoint/"
  echo "----------------------------------------"
  
  if [ "$method" = "POST" ] && [ ! -z "$data" ]; then
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" \
      -X POST \
      -H "x-api-key: $API_KEY" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL/$endpoint/")
  else
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" \
      -X "$method" \
      -H "x-api-key: $API_KEY" \
      -H "Accept: application/json" \
      "$BASE_URL/$endpoint/")
  fi
  
  http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
  body=$(echo "$response" | sed '/HTTP_CODE:/d')
  
  echo "HTTP Status: $http_code"
  
  # Check if successful (2xx codes)
  if [[ $http_code =~ ^2 ]]; then
    echo "✅ SUCCESS"
  elif [[ $http_code == "401" ]]; then
    echo "🔐 AUTH REQUIRED (Normal for protected endpoints)"  
  elif [[ $http_code == "405" ]]; then
    echo "📝 METHOD NOT ALLOWED (Try different HTTP method)"
  else
    echo "❌ ERROR"
  fi
  
  # Show response body (truncated for readability)
  if echo "$body" | grep -q "{"; then
    echo "Response: JSON"
    echo "$body" | cut -c1-200 | tr -d '\n'
    if [ ${#body} -gt 200 ]; then echo "... [truncated]"; else echo ""; fi
  else
    echo "Response: $(echo "$body" | head -c50)..."
  fi
}

echo ""
echo "🔍 CORE ENDPOINTS:"
test_endpoint "health" "GET"
test_endpoint "debug" "GET" 
test_endpoint "login" "POST" '{"email": "benefitadmin@sinarmasmining.com", "password": "benefit2024"}'

echo ""
echo "💬 CHAT ENDPOINTS:"
test_endpoint "chat/company-codes" "GET"
test_endpoint "chat/history-filtered" "POST" '{"startDate": "2024-01-01", "endDate": "2024-12-31", "limit": 10}'
test_endpoint "chat/menu-options" "GET"

echo ""
echo "🏢 ADMIN ENDPOINTS:"
test_endpoint "knowledge-benefit" "GET"
test_endpoint "menu-master" "GET"
test_endpoint "menu-master" "POST" '{"menuName": "Test Menu", "menuDescription": "Test Description", "isActive": true}'

echo ""
echo "🔗 MAPPING ENDPOINTS:"
test_endpoint "cc-benefit-mapping" "GET"
test_endpoint "cc-benefit-mapping-mock" "GET"
test_endpoint "cc-pp-mapping" "GET"

echo ""
echo "📊 MONITORING ENDPOINTS:"
test_endpoint "monitoring/backup-schedule" "GET"
test_endpoint "monitoring/chat-history" "GET"
test_endpoint "monitoring/chat-stats" "GET"
test_endpoint "monitoring/company-contacts" "GET"
test_endpoint "monitoring/unique-contacts" "GET"

echo ""
echo "🔄 PROCESSING ENDPOINTS:"
test_endpoint "md-to-vector-pipeline" "GET"
test_endpoint "pdf-to-md-pipeline" "GET"

echo ""
echo "📤 EXPORT & INTEGRATION:"
test_endpoint "export/comprehensive" "POST" '{"startDate": "2024-01-01", "endDate": "2024-12-31", "exportType": "excel"}'
test_endpoint "sheets" "GET"
test_endpoint "n8n-webhook" "POST" '{"action": "test_webhook", "data": {"message": "Test"}}'

echo ""
echo "🔧 LEGACY & UTILS:"
test_endpoint "test" "GET"
test_endpoint "v1" "GET"

echo ""
echo "========================================"
echo "📋 SUMMARY:"
echo "✅ = Working properly"
echo "🔐 = Authentication required (normal)"
echo "📝 = Wrong HTTP method (try POST instead of GET)"
echo "❌ = Actual error"
echo ""
echo "🎯 NEXT STEPS:"
echo "1. Import updated Postman collection"
echo "2. Use trailing slash URLs: {baseUrl}/{endpoint}/"
echo "3. Include x-api-key header: sm2024_admin_api_key_secure_access"
echo "4. Test POST endpoints with proper JSON body"
echo "========================================"